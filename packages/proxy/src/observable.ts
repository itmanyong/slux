/**
 * @file 可观察代理的核心实现：用 Proxy 拦截读写，按属性、存在性、键集合与整体版本维护信号，并沿父子链向上传播失效。
 */
import { batch, signal } from "@slux/core";
import type { Signal } from "@slux/core";
import { runAll } from "@slux/shared";
import { isRef } from "./ref.js";

/** Proxy 与内部状态共用的目标对象类型。 */
type Target = Record<PropertyKey, unknown>;

/**
 * 单个可观察对象背后的内部状态：以属性、存在性、键集合、整体四类信号分别追踪不同粒度的读取，配合 parents 反向链向上传播失效。
 */
export type ProxyState = {
  /** 原始目标对象，所有真实读写最终落到它上面。 */
  target: Target;
  /** 对外暴露的 Proxy 对象。 */
  proxy: object;
  /** 属性级版本信号，键为属性。 */
  props: Map<PropertyKey, Signal<number>>;
  /** 存在性版本信号，供 has 与删除追踪使用。 */
  presence: Map<PropertyKey, Signal<number>>;
  /** 键集合变化信号，供 ownKeys 追踪键的新增与删除。 */
  keys: Signal<number>;
  /** 整体版本信号，供 snapshot 订阅任意变化。 */
  revision: Signal<number>;
  /** 当前版本号，每次 publish 时递增。 */
  version: number;
  /** 各属性当前链接到的子状态。 */
  children: Map<PropertyKey, ProxyState>;
  /** 反向父状态集合，用于把子对象的变化向上传播。 */
  parents: Set<ProxyState>;
  /** 订阅回调集合，在 publish 时被调用。 */
  listeners: Set<() => void>;
  /** 缓存快照，未生成时为 undefined。 */
  cachedSnapshot: object | undefined;
  /** 缓存快照对应的版本号，与 version 不等时缓存失效。 */
  snapshotVersion: number;
};

// 以 target 与 proxy 两种引用形式都能反查到状态，故双向登记。
const states = new WeakMap<object, ProxyState>();
const proxyStates = new WeakMap<object, ProxyState>();

/**
 * 若 value 是可观察代理则返回其原始目标，否则原样返回；用于写入或比较前剥掉代理层。
 * @param value 待解引用的值。
 * @returns 解引用后的值，非代理时为 value 本身。
 */
export function rawTarget<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  return (proxyStates.get(value)?.target ?? value) as T;
}

/**
 * 判定一个值是否可被代理：仅接受普通对象、数组或无原型对象，排除 ref 与 null 及基本类型。
 * @param value 待判定的值。
 * @returns true 表示可安全代理。
 */
export function canProxy(value: unknown): value is object {
  if (value === null || typeof value !== "object" || isRef(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === Array.prototype || prototype === null;
}

/**
 * 取得可观察对象（proxy 或原始 target）对应的内部状态。
 * @param value 可观察对象的 proxy 或原始 target。
 * @returns 对应的 ProxyState，调用方不应改写其内部字段。
 * @throws 当 value 不是可观察对象时抛出 Error。
 * @see ensureState
 */
export function getProxyState(value: object): ProxyState {
  const state = proxyStates.get(value) ?? states.get(value);
  if (!state) throw new Error("Object is not an observable");
  return state;
}

/**
 * 追踪对某个属性的读取：惰性创建版本信号并读取以建立依赖。
 * @param signals 属性到版本信号的映射，缺失时写入新信号。
 * @param prop 被读取的属性键。
 */
function trackProperty(signals: Map<PropertyKey, Signal<number>>, prop: PropertyKey): void {
  let source = signals.get(prop);
  if (!source) {
    source = signal(0);
    signals.set(prop, source);
  }
  source.get();
}

/**
 * 把某属性当前的值链接为子代理状态，并维护父子双向关系。
 * @param state 父代理状态。
 * @param prop 被链接的属性键。
 * @param value 该属性当前的值，为 undefined 表示解除链接。
 * @returns 链接到的子状态，不可代理或无需链接时为 undefined。
 * @remarks 移除旧链接时，需确认旧子状态不再被本状态的其它属性引用才删除反向父引用，避免多属性共享同一子对象时误删。
 * @see ensureState
 */
export function linkChild(state: ProxyState, prop: PropertyKey, value: unknown): ProxyState | undefined {
  const raw = rawTarget(value);
  const child = canProxy(raw) ? ensureState(raw) : undefined;
  const previous = state.children.get(prop);
  if (previous === child) return child;
  state.children.delete(prop);
  if (previous && !Array.from(state.children.values()).includes(previous)) previous.parents.delete(state);
  if (child) {
    state.children.set(prop, child);
    child.parents.add(state);
  }
  return child;
}

/**
 * 发布一次变更：沿 parents 链使所有祖先失效、更新各追踪信号并通知订阅者。
 * @param state 发生变更的代理状态。
 * @param properties 值发生变化的属性集合。
 * @param presence 存在性发生变化的属性集合。
 * @param keysChanged 键集合是否变化。
 * @remarks 信号写入合并到 batch 中；listeners 在派发前快照，派发期间被取消的回调不再调用。
 * @see batch
 */
function publish(state: ProxyState, properties: Iterable<PropertyKey>, presence: Iterable<PropertyKey>, keysChanged: boolean): void {
  // 遍历中向 Set 追加父节点，借助去重使循环引用或多路径共享只传播一次。
  const affected = new Set([state]);
  for (const current of affected) {
    current.version++;
    for (const parent of current.parents) affected.add(parent);
  }
  // 快照监听者，避免派发期间的增删影响本轮通知。
  const notifications = Array.from(affected, (current) => ({
    current,
    callbacks: Array.from(current.listeners),
  }));
  runAll([
    () =>
      batch(() => {
        for (const prop of properties) state.props.get(prop)?.set(state.version);
        for (const prop of presence) state.presence.get(prop)?.set(state.version);
        if (keysChanged) state.keys.set(state.version);
        for (const current of affected) current.revision.set(current.version);
      }),
    () =>
      runAll(
        notifications.flatMap(({ current, callbacks }) =>
          callbacks.map((callback) => () => {
            if (current.listeners.has(callback)) callback();
          }),
        ),
      ),
  ]);
}

/**
 * 定义一个属性，比较定义前后的描述符判是否有实质变化，仅在变化时差量发布。
 * @param state 目标对应的代理状态。
 * @param prop 被定义的属性键。
 * @param descriptor 要应用的属性描述符。
 * @returns Reflect.defineProperty 的成功标志。
 * @remarks 改数组 length 时需先记录全部索引键，以检测缩短后被删除的索引。
 * @see publish
 */
function defineProperty(state: ProxyState, prop: PropertyKey, descriptor: PropertyDescriptor): boolean {
  const target = state.target;
  const before = Reflect.getOwnPropertyDescriptor(target, prop);
  const previousLength = Array.isArray(target) ? target.length : undefined;
  const had = Reflect.has(target, prop);
  const removed =
    Array.isArray(target) && prop === "length" ? Reflect.ownKeys(target).filter((key) => typeof key === "string" && isArrayIndex(key)) : [];
  const success = Reflect.defineProperty(target, prop, descriptor);
  const after = Reflect.getOwnPropertyDescriptor(target, prop);
  if (
    before?.configurable === after?.configurable &&
    before?.enumerable === after?.enumerable &&
    before?.writable === after?.writable &&
    before?.get === after?.get &&
    before?.set === after?.set &&
    Object.is(rawTarget(before?.value), rawTarget(after?.value))
  )
    return success;

  linkChild(state, prop, after?.value);
  const properties = new Set<PropertyKey>([prop]);
  const presence = new Set<PropertyKey>();
  if (had !== Reflect.has(target, prop)) presence.add(prop);
  let keysChanged = !before || before.enumerable !== after?.enumerable;
  if (Array.isArray(target) && target.length !== previousLength) {
    properties.add("length");
    for (const key of removed) {
      if (Object.hasOwn(target, key)) continue;
      properties.add(key);
      presence.add(key);
      linkChild(state, key, undefined);
      keysChanged = true;
    }
  }
  publish(state, properties, presence, keysChanged);
  return success;
}

/**
 * 判定字符串是否为规范的数组索引（0 到 2 ** 32 - 2 之间的非负整数）。
 * @param prop 待判定的属性键字符串。
 * @returns true 表示是规范数组索引。
 */
function isArrayIndex(prop: string): boolean {
  const index = Number(prop);
  return Number.isInteger(index) && index >= 0 && index < 2 ** 32 - 1 && String(index) === prop;
}

/**
 * Proxy 拦截器集合：读操作按粒度追踪依赖，写操作经 rawTarget 与 defineProperty 差量发布。
 */
const handler: ProxyHandler<Target> = {
  /**
   * 读取属性：追踪该属性依赖，并在值可代理时返回子代理。
   */
  get(target, prop, receiver) {
    const state = states.get(target)!;
    trackProperty(state.props, prop);
    const value: unknown = Reflect.get(target, prop, receiver);
    const descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
    // Proxy 规范要求不可配置且不可写的数据属性返回原引用，不能替换成子代理。
    if (descriptor?.configurable === false && descriptor.writable === false) return value;
    return linkChild(state, prop, value)?.proxy ?? value;
  },
  /**
   * 写入属性：值先解引用，避免把代理对象存入 target。
   */
  set(target, prop, value: unknown, receiver) {
    return Reflect.set(target, prop, rawTarget(value), receiver);
  },
  /**
   * 定义属性：转调自定义的 defineProperty 完成差量比较与发布。
   */
  defineProperty(target, prop, descriptor) {
    return defineProperty(states.get(target)!, prop, descriptor);
  },
  /**
   * 删除属性：仅在删除自有属性成功时解除子链接并发布变更。
   */
  deleteProperty(target, prop) {
    const had = Object.hasOwn(target, prop);
    const success = Reflect.deleteProperty(target, prop);
    if (success && had) {
      const state = states.get(target)!;
      linkChild(state, prop, undefined);
      publish(state, [prop], Reflect.has(target, prop) ? [] : [prop], true);
    }
    return success;
  },
  /**
   * in 判定：追踪属性存在性依赖后返回结果。
   */
  has(target, prop) {
    trackProperty(states.get(target)!.presence, prop);
    return Reflect.has(target, prop);
  },
  /**
   * 键枚举：追踪键集合依赖后返回全部自有键。
   */
  ownKeys(target) {
    states.get(target)!.keys.get();
    return Reflect.ownKeys(target);
  },
};

/**
 * 取得或创建目标对应的代理状态：构造 Proxy 与全套信号、登记双向映射并预先链接子属性；同一 target 幂等复用。
 * @param target 要包装的原始目标对象。
 * @returns 新建或复用的 ProxyState。
 * @remarks snapshotVersion 初始为 -1，保证首次读取快照必然重建；预先链接子属性，使独立持有的子代理写入也能沿 parents 使父快照失效。
 * @see linkChild
 */
function ensureState(target: object): ProxyState {
  const existing = states.get(target);
  if (existing) return existing;
  const state: ProxyState = {
    target: target as Target,
    proxy: new Proxy(target as Target, handler),
    props: new Map(),
    presence: new Map(),
    keys: signal(0),
    revision: signal(0),
    version: 0,
    children: new Map(),
    parents: new Set(),
    listeners: new Set(),
    cachedSnapshot: undefined,
    snapshotVersion: -1,
  };
  states.set(target, state);
  proxyStates.set(state.proxy, state);
  for (const prop of Reflect.ownKeys(target)) {
    const descriptor = Reflect.getOwnPropertyDescriptor(target, prop)!;
    if ("value" in descriptor) linkChild(state, prop, descriptor.value);
  }
  return state;
}

/**
 * 把一个普通对象或数组包装为可观察代理；重复包装同一对象返回同一个代理。
 * @param initialObj 要包装的对象或数组，传入已有代理时复用其原始目标。
 * @returns 可观察代理，读写经 Proxy 拦截。
 * @throws 当 initialObj 不是普通对象或数组时抛出 Error。
 * @see ensureState
 * @see canProxy
 */
export function observable<T extends object>(initialObj: T): T {
  const raw = rawTarget(initialObj);
  if (!canProxy(raw)) throw new Error("observable() requires a plain object or array");
  return ensureState(raw).proxy as T;
}

/**
 * 订阅可观察对象的变更，返回取消订阅句柄。
 * @param proxy 由 observable 创建的可观察代理。
 * @param callback 变更发布时被调用的回调。
 * @returns 取消订阅函数，重复调用幂等。
 * @remarks 回调在 publish 的统一派发时机被调用，不应假设写入后立即执行。
 * @see publish
 */
export function subscribe(proxy: object, callback: () => void): () => void {
  const state = getProxyState(proxy);
  state.listeners.add(callback);
  return () => {
    state.listeners.delete(callback);
  };
}
