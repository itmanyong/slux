import { getProxyState, linkChild } from "./observable.js";
import type { ProxyState } from "./observable.js";
import type { Snapshot } from "./types.js";

export function snapshot<T extends object>(proxy: T): Snapshot<T> {
  const state = getProxyState(proxy);
  state.revision.get();
  return createSnapshot(state, new Map()) as Snapshot<T>;
}

function createSnapshot(state: ProxyState, seen: Map<ProxyState, object>): object {
  const pending = seen.get(state);
  if (pending) return pending;
  if (state.cachedSnapshot && state.snapshotVersion === state.version) return state.cachedSnapshot;
  const target = state.target;
  const result: object = Array.isArray(target) ? new Array(target.length) : Object.create(Object.getPrototypeOf(target));
  seen.set(state, result);
  for (const prop of Reflect.ownKeys(target)) {
    if (Array.isArray(target) && prop === "length") continue;
    const descriptor = Reflect.getOwnPropertyDescriptor(target, prop)!;
    const value: unknown = Reflect.get(target, prop, state.proxy);
    const child = linkChild(state, prop, value);
    Object.defineProperty(result, prop, {
      value: child ? createSnapshot(child, seen) : value,
      enumerable: descriptor.enumerable ?? false,
      configurable: true,
      writable: true,
    });
  }
  Object.freeze(result);
  state.cachedSnapshot = result;
  state.snapshotVersion = state.version;
  return result;
}
