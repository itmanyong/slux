import { batch, signal } from "@slux/core";
import type { Signal } from "@slux/core";
import { runAll } from "@slux/shared";
import { isRef } from "./ref.js";

type Target = Record<PropertyKey, unknown>;

export type ProxyState = {
  target: Target;
  proxy: object;
  props: Map<PropertyKey, Signal<number>>;
  presence: Map<PropertyKey, Signal<number>>;
  keys: Signal<number>;
  revision: Signal<number>;
  version: number;
  children: Map<PropertyKey, ProxyState>;
  parents: Set<ProxyState>;
  listeners: Set<() => void>;
  cachedSnapshot: object | undefined;
  snapshotVersion: number;
};

const states = new WeakMap<object, ProxyState>();
const proxyStates = new WeakMap<object, ProxyState>();

export function rawTarget<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  return (proxyStates.get(value)?.target ?? value) as T;
}

export function canProxy(value: unknown): value is object {
  if (value === null || typeof value !== "object" || isRef(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === Array.prototype || prototype === null;
}

export function getProxyState(value: object): ProxyState {
  const state = proxyStates.get(value) ?? states.get(value);
  if (!state) throw new Error("Object is not an observable");
  return state;
}

function trackProperty(signals: Map<PropertyKey, Signal<number>>, prop: PropertyKey): void {
  let source = signals.get(prop);
  if (!source) {
    source = signal(0);
    signals.set(prop, source);
  }
  source.get();
}

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

function publish(state: ProxyState, properties: Iterable<PropertyKey>, presence: Iterable<PropertyKey>, keysChanged: boolean): void {
  // 先使所有祖先快照失效，循环或多路径共享子节点只传播一次。
  const affected = new Set([state]);
  for (const current of affected) {
    current.version++;
    for (const parent of current.parents) affected.add(parent);
  }
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

function isArrayIndex(prop: string): boolean {
  const index = Number(prop);
  return Number.isInteger(index) && index >= 0 && index < 2 ** 32 - 1 && String(index) === prop;
}

const handler: ProxyHandler<Target> = {
  get(target, prop, receiver) {
    const state = states.get(target)!;
    trackProperty(state.props, prop);
    const value: unknown = Reflect.get(target, prop, receiver);
    const descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
    // Proxy 规范要求固定数据属性返回原引用，不能替换成子代理。
    if (descriptor?.configurable === false && descriptor.writable === false) return value;
    return linkChild(state, prop, value)?.proxy ?? value;
  },
  set(target, prop, value: unknown, receiver) {
    return Reflect.set(target, prop, rawTarget(value), receiver);
  },
  defineProperty(target, prop, descriptor) {
    return defineProperty(states.get(target)!, prop, descriptor);
  },
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
  has(target, prop) {
    trackProperty(states.get(target)!.presence, prop);
    return Reflect.has(target, prop);
  },
  ownKeys(target) {
    states.get(target)!.keys.get();
    return Reflect.ownKeys(target);
  },
};

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
  // 预先连接数据属性，独立持有的子代理写入也能使父快照失效。
  for (const prop of Reflect.ownKeys(target)) {
    const descriptor = Reflect.getOwnPropertyDescriptor(target, prop)!;
    if ("value" in descriptor) linkChild(state, prop, descriptor.value);
  }
  return state;
}

export function observable<T extends object>(initialObj: T): T {
  const raw = rawTarget(initialObj);
  if (!canProxy(raw)) throw new Error("observable() requires a plain object or array");
  return ensureState(raw).proxy as T;
}

export function subscribe(proxy: object, callback: () => void): () => void {
  const state = getProxyState(proxy);
  state.listeners.add(callback);
  return () => {
    state.listeners.delete(callback);
  };
}
