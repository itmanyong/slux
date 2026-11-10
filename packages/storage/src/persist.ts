import { PERSIST_ERROR_CODE } from "./errors.js";
import { memoryStorage } from "./memory-storage.js";
import type { PersistEnvelope, PersistErrorCode, PersistMiddleware, PersistMiddlewareAPI, PersistOptions } from "./types.js";

/** 存储入口只校验 envelope；业务字段由调用方的 deserialize 或 migrate 校验。 */
function readEnvelope<T>(value: unknown): PersistEnvelope<Partial<T>> {
  if (typeof value !== "object" || value === null || !("state" in value)) {
    throw new TypeError("持久化数据缺少 state");
  }
  const version = "version" in value ? value.version : 0;
  if (typeof version !== "number" || !Number.isFinite(version)) {
    throw new TypeError("持久化 version 必须是有限数字");
  }
  return { state: value.state as Partial<T>, version };
}

export function persist<T>(options: PersistOptions<T>): PersistMiddleware<T> {
  const {
    key,
    storage = memoryStorage(),
    version = 0,
    partialize,
    migrate,
    onError,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    merge = (persisted, current) => ({ ...current, ...persisted }),
    skipHydration = false,
  } = options;
  let api: PersistMiddlewareAPI<T> | undefined;
  let destroyed = false;
  let hydrated = false;
  let hydrationGeneration = 0;
  let hydration: Promise<void> | undefined;
  let finishPending: (() => void) | undefined;
  let writeTail: Promise<void> | undefined;
  const callbacks = new Set<(state: T) => void>();

  function report(code: PersistErrorCode, cause: unknown): void {
    if (destroyed) return;
    try {
      onError?.({ code, message: `持久化 "${key}" 失败：${code}`, cause });
    } catch {
      /* 错误观察器不能中断状态更新或制造未处理的 Promise。 */
    }
  }

  function notify(callback: (state: T) => void): void {
    if (api === undefined || destroyed || !callbacks.has(callback)) return;
    try {
      callback(api.getState());
    } catch {
      /* 单个观察器失败不能阻止其余观察器或 rehydrate 完成。 */
    }
  }

  function finishHydration(): void {
    if (destroyed) return;
    hydrated = true;
    const resolve = finishPending;
    finishPending = undefined;
    hydration = undefined;
    resolve?.();
    for (const callback of Array.from(callbacks)) notify(callback);
  }

  /** 同步后端保持同步写入；异步写入和删除共享队列，避免旧写入覆盖新值。 */
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
      void tail.then(() => {
        if (writeTail === tail) writeTail = undefined;
      });
      return tail;
    }
    return undefined;
  }

  function persistState(): void {
    if (api === undefined || destroyed) return;
    let value: string;
    try {
      const state = api.getState();
      value = serialize({ state: partialize === undefined ? state : partialize(state), version });
    } catch (error) {
      report(PERSIST_ERROR_CODE.SerializationFailed, error);
      return;
    }
    enqueue(() => storage.setItem(key, value));
  }

  function applyState(state: Partial<T>): void {
    if (api === undefined || destroyed) return;
    try {
      api.setState(merge(state, api.getState()));
    } catch (error) {
      report(PERSIST_ERROR_CODE.DeserializationFailed, error);
    }
    finishHydration();
  }

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
    name: "persist",
    init(middlewareApi) {
      api = middlewareApi;
      if (!skipHydration) void rehydrate();
    },
    onSet(_api, next, partial) {
      next(partial);
      persistState();
    },
    onDestroy() {
      destroyed = true;
      callbacks.clear();
      api = undefined;
      finishPending?.();
      finishPending = undefined;
      hydration = undefined;
    },
    rehydrate,
    hasHydrated: () => hydrated,
    onHydrate(callback) {
      if (destroyed) return () => {};
      callbacks.add(callback);
      if (hydrated) {
        const generation = hydrationGeneration;
        queueMicrotask(() => {
          if (generation === hydrationGeneration) notify(callback);
        });
      }
      return () => {
        callbacks.delete(callback);
      };
    },
    clearStorage: () => enqueue(() => storage.removeItem(key)) ?? Promise.resolve(),
  };
}
