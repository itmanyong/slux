/**
 * @file 快照生成：把可观察代理转换为只读深快照，带版本缓存与循环引用处理。
 */
import { getProxyState, linkChild } from "./observable.js";
import type { ProxyState } from "./observable.js";
import type { Snapshot } from "./types.js";

/**
 * 生成代理对象当前状态的只读深快照。
 * @param proxy 由 observable 创建的可观察代理。
 * @returns 只读深快照，命中版本缓存时直接复用。
 * @remarks 先读取 revision 使本次调用纳入版本追踪，再做快照构建。
 * @see createSnapshot
 */
export function snapshot<T extends object>(proxy: T): Snapshot<T> {
  const state = getProxyState(proxy);
  state.revision.get();
  return createSnapshot(state, new Map()) as Snapshot<T>;
}

/**
 * 递归构建某个 ProxyState 的只读快照，处理缓存、循环引用与子代理。
 * @param state 待构建快照的代理状态。
 * @param seen 状态到已建快照的映射，用于循环引用检测与共享；递归调用须透传同一实例。
 * @returns 只读快照对象，可能复用缓存或 seen 中的占位对象。
 * @remarks 先把占位结果登记进 seen 再递归子属性，循环引用才能命中同一对象；构建完成后冻结并写入版本缓存。
 * @see snapshot
 */
function createSnapshot(state: ProxyState, seen: Map<ProxyState, object>): object {
  const pending = seen.get(state);
  if (pending) return pending;
  if (state.cachedSnapshot && state.snapshotVersion === state.version) return state.cachedSnapshot;
  // 数组建同长度数组，其余以目标原型创建以保留原型链。
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
