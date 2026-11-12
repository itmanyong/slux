/**
 * @file 实现 persist 中间件：把 store 状态序列化后写入可插拔存储后端，并在初始化或调用时读回、迁移、合并。
 * 写操作经队列串行化避免旧值覆盖新值；注水受销毁标记与代际号保护，仅最新一次注水会派发通知。
 */
import { PERSIST_ERROR_CODE } from "./errors.js";
import { memoryStorage } from "./memory-storage.js";
import type { PersistEnvelope, PersistErrorCode, PersistMiddleware, PersistMiddlewareAPI, PersistOptions } from "./types.js";

/**
 * 校验反序列化结果的结构合法性，仅做最小校验（非 null 对象、含 state、version 为有限数字）。
 * @param value 反序列化得到的任意值，可能来自存储内容。
 * @returns 结构合法的信封；state 按 Partial<T> 收窄，version 缺省补 0。
 * @remarks 结构非法时抛 TypeError，由调用方按反序列化失败处理。
 */
function readEnvelope<T>(value: unknown): PersistEnvelope<Partial<T>> {
  if (typeof value !== "object" || value === null || !("state" in value)) {
    throw new TypeError("持久化数据缺少 state");
  }
  // version 缺省回退到 0，兼容未带版本号的旧数据。
  const version = "version" in value ? value.version : 0;
  // 版本须为有限数字：NaN/Infinity 无法可靠参与相等比较，会破坏迁移判断。
  if (typeof version !== "number" || !Number.isFinite(version)) {
    throw new TypeError("持久化 version 必须是有限数字");
  }
  return { state: value.state as Partial<T>, version };
}

/**
 * 创建一个持久化中间件，把状态写入存储并在注水时读回、按需迁移后合并到当前状态。
 * 存储后端、序列化、裁剪、合并、迁移与错误观察器均可注入，缺省时分别落到内存存储、JSON 与浅合并，
 * 使同一中间件可适配同步/异步后端；写操作统一经队列串行化，避免并发写入乱序。
 * @param options 配置集合；key 必填，其余项缺省时取默认值。
 * @returns 实现 PersistMiddleware<T> 的控制对象。
 * @remarks 失败经可选 onError 上报 PersistError 而不抛出；destroy 后所有操作被抑制。
 * @see PersistMiddleware
 * @see PersistOptions
 */
export function persist<T>(options: PersistOptions<T>): PersistMiddleware<T> {
  const {
    key,
    storage = memoryStorage(), // 缺省用内存存储，保证无外部后端时仍可运行。
    version = 0, // 与 readEnvelope 的缺省版本一致。
    partialize,
    migrate,
    onError,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    merge = (persisted, current) => ({ ...current, ...persisted }),
    skipHydration = false,
  } = options;
  // 由 init 注入的中间件 API；未注入或销毁后为 undefined。
  let api: PersistMiddlewareAPI<T> | undefined;
  // 销毁标记：置真后所有读写与通知被抑制。
  let destroyed = false;
  let hydrated = false;
  // 注水代际号：每次 rehydrate 递增，用于丢弃被新注水覆盖的旧延迟回调。
  let hydrationGeneration = 0;
  // 进行中的注水 Promise，供并发调用共享同一次注水。
  let hydration: Promise<void> | undefined;
  let finishPending: (() => void) | undefined;
  // 写入队列尾部的 Promise：异步写入串接其后，保证按发起顺序落盘。
  let writeTail: Promise<void> | undefined;
  const callbacks = new Set<(state: T) => void>();

  /**
   * 向可选的 onError 观察器上报一次结构化错误。
   * @param code 错误分类码，取自 PERSIST_ERROR_CODE。
   * @param cause 触发错误的原始值。
   * @remarks 观察器自身抛错会被吞掉，避免中断状态更新或产生未处理的 Promise。
   */
  function report(code: PersistErrorCode, cause: unknown): void {
    if (destroyed) return;
    try {
      onError?.({ code, message: `持久化 "${key}" 失败：${code}`, cause });
    } catch {
      /* 错误观察器不能中断状态更新或制造未处理的 Promise。 */
    }
  }

  /**
   * 以当前状态调用单个注水回调，并隔离其异常。
   * @param callback 待触发的回调。
   * @remarks 回调抛错被吞掉，不影响其它回调或注水完成。
   */
  function notify(callback: (state: T) => void): void {
    if (api === undefined || destroyed || !callbacks.has(callback)) return;
    try {
      callback(api.getState());
    } catch {
      /* 单个观察器失败不能阻止其余观察器或 rehydrate 完成。 */
    }
  }

  /**
   * 收尾一次注水：标记完成、唤醒等待者、清空进行中状态并派发全部回调。
   */
  function finishHydration(): void {
    if (destroyed) return;
    hydrated = true;
    // 先取出并清空 resolve 句柄再调用，防止重入时被重复 resolve。
    const resolve = finishPending;
    finishPending = undefined;
    hydration = undefined;
    resolve?.();
    // 用快照遍历，允许回调在通知过程中注销自身而不影响本轮迭代。
    for (const callback of Array.from(callbacks)) notify(callback);
  }

  /**
   * 调度一次写入/删除：同步操作立即执行，异步操作接入串行队列，保证旧写入不会晚于新值落盘。
   * @param operation 产出 void 或 Promise<void> 的动作，仅在未销毁时执行。
   * @returns 异步操作返回代表该写入的 Promise；同步操作返回 undefined，不引入多余微任务。
   * @remarks 同步抛错或 Promise 拒绝时上报 StorageWriteFailed，不向调用方抛出。
   */
  function enqueue(operation: () => void | Promise<void>): Promise<void> | undefined {
    const run = (): void | Promise<void> => {
      if (destroyed) return;
      try {
        const result = operation();
        if (result !== undefined) return Promise.resolve(result).catch((error: unknown) => report(PERSIST_ERROR_CODE.StorageWriteFailed, error));
      } catch (error) {
        report(PERSIST_ERROR_CODE.StorageWriteFailed, error);
      }
    };
    const result = writeTail === undefined ? run() : writeTail.then(run);
    if (result !== undefined) {
      const tail = Promise.resolve(result);
      writeTail = tail;
      // 尾部完成后，仅当它仍是当前尾部才清空，避免被后加入的写入误清。
      void tail.then(() => {
        if (writeTail === tail) writeTail = undefined;
      });
      return tail;
    }
    return undefined;
  }

  /**
   * 读取当前状态、裁剪并序列化，然后把写入动作排入队列。
   * @remarks 序列化在入队前同步完成，避免状态在排队期间变化导致写入内容不一致；失败时上报 SerializationFailed 并放弃本次写入。
   */
  function persistState(): void {
    if (api === undefined || destroyed) return;
    let value: string;
    try {
      const state = api.getState();
      value = serialize({
        state: partialize === undefined ? state : partialize(state),
        version,
      });
    } catch (error) {
      report(PERSIST_ERROR_CODE.SerializationFailed, error);
      return;
    }
    enqueue(() => storage.setItem(key, value));
  }

  /**
   * 把（迁移后的）持久化状态合并进当前状态，并收尾注水。
   * @param state 待合并的持久化状态子集。
   * @remarks 合并失败时上报 DeserializationFailed，但注水仍标记完成，避免等待永久挂起。
   */
  function applyState(state: Partial<T>): void {
    if (api === undefined || destroyed) return;
    try {
      api.setState(merge(state, api.getState()));
    } catch (error) {
      report(PERSIST_ERROR_CODE.DeserializationFailed, error);
    }
    // 无论合并成功与否都收尾，保证 rehydrate 的 Promise 一定 resolve。
    finishHydration();
  }

  /**
   * 处理从存储读回的原始字符串：空值直接完成注水；合法信封按版本决定直接应用、迁移或放弃。
   * @param raw 存储返回的原始字符串，null 或空串视为无数据。
   * @remarks 反序列化失败上报 DeserializationFailed、迁移失败上报 MigrationFailed，两者都仍完成注水。
   */
  function handleValue(raw: string | null): void {
    if (destroyed) return;
    if (raw === null || raw === "") {
      finishHydration();
      return;
    }
    let envelope: PersistEnvelope<Partial<T>>;
    try {
      envelope = readEnvelope<T>(deserialize(raw));
    } catch (error) {
      report(PERSIST_ERROR_CODE.DeserializationFailed, error);
      // 即便解析失败也完成注水，避免调用方永久等待。
      finishHydration();
      return;
    }
    if (envelope.version === version) {
      applyState(envelope.state);
      return;
    }
    if (migrate === undefined) {
      finishHydration();
      return;
    }
    try {
      const result = migrate(envelope.state, envelope.version);
      // migrate 可能同步返回 Partial<T> 或返回 Promise，用 thenable 鸭子类型判断以兼容两者。
      if (result !== null && typeof result === "object" && "then" in result && typeof result.then === "function") {
        void Promise.resolve(result).then(applyState, (error: unknown) => {
          report(PERSIST_ERROR_CODE.MigrationFailed, error);
          finishHydration();
        });
      } else {
        applyState(result as Partial<T>);
      }
    } catch (error) {
      report(PERSIST_ERROR_CODE.MigrationFailed, error);
      finishHydration();
    }
  }

  /**
   * 触发一次注水：从存储读取、处理数据并合并状态，返回在注水完成时 resolve 的 Promise。
   * 并发调用共享同一次进行中的注水；代际号使被新注水覆盖的旧延迟回调失效。
   * @returns 注水完成的 Promise；已销毁或 api 未注入时返回已 resolve 的 Promise。
   * @remarks 读取同步抛错或异步拒绝时上报 StorageReadFailed 并完成注水，不向调用方抛出。
   */
  function rehydrate(): Promise<void> {
    if (destroyed || api === undefined) return Promise.resolve();
    if (hydration !== undefined) return hydration;
    hydrated = false;
    hydrationGeneration++;
    const pending = new Promise<void>((resolve) => {
      finishPending = resolve;
    });
    hydration = pending;
    try {
      const result = storage.getItem(key);
      if (typeof result === "string" || result === null) handleValue(result);
      else
        void Promise.resolve(result).then(handleValue, (error: unknown) => {
          report(PERSIST_ERROR_CODE.StorageReadFailed, error);
          finishHydration();
        });
    } catch (error) {
      report(PERSIST_ERROR_CODE.StorageReadFailed, error);
      finishHydration();
    }
    return pending;
  }

  return {
    /** 中间件名称，恒为 "persist"，用于标识。 */
    name: "persist",
    /**
     * 生命周期钩子：注入中间件 API，并在未跳过时触发自动注水。
     * @param middlewareApi 由 store 提供的状态读写 API。
     */
    init(middlewareApi) {
      api = middlewareApi;
      if (!skipHydration) void rehydrate();
    },
    /**
     * 写入钩子：先放行状态更新，再把更新后的状态持久化。
     * @param _api 中间件 API（未使用）。
     * @param next 链式写入函数。
     * @param partial 本次写入的状态片段。
     * @remarks next 必须先于 persistState 调用，否则会持久化到更新前的旧状态。
     */
    onSet(_api, next, partial) {
      next(partial);
      persistState();
    },
    /**
     * 销毁钩子：抑制后续操作并释放引用与等待句柄。
     * @remarks 会 resolve 挂起的等待 Promise，避免调用方永久挂起。
     */
    onDestroy() {
      destroyed = true;
      callbacks.clear();
      api = undefined;
      finishPending?.();
      finishPending = undefined;
      hydration = undefined;
    },
    /** 触发注水；行为与错误处理见 rehydrate 函数的 JSDoc。 */
    rehydrate,
    /** 查询是否已完成注水。 */
    hasHydrated: () => hydrated,
    /**
     * 注册注水完成回调，返回注销函数。
     * @param callback 注水完成后以当前状态调用的回调。
     * @returns 注销该回调的函数。
     * @remarks 注册时已注水则以 queueMicrotask 延迟派发，并以代际号保证只有最新一轮注水才通知。
     */
    onHydrate(callback) {
      if (destroyed) return () => {};
      callbacks.add(callback);
      if (hydrated) {
        // 记录当前代际；若在派发前发生新一轮注水，则本次通知作废。
        const generation = hydrationGeneration;
        // 延迟到微任务派发，避免在注册调用栈内同步触发回调。
        queueMicrotask(() => {
          if (generation === hydrationGeneration) notify(callback);
        });
      }
      return () => {
        callbacks.delete(callback);
      };
    },
    /**
     * 清空该持久化键对应的存储数据。
     * @returns 等待删除完成的 Promise。
     */
    clearStorage: () => enqueue(() => storage.removeItem(key)) ?? Promise.resolve(),
  };
}
