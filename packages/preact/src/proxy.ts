/**
 * @file proxy 快照 hook：useSnapshot 把 @slux/proxy 的 subscribe / snapshot 经 useSyncExternalStore 接入 Preact，读取代理对象的当前快照。
 */

import { useCallback } from "preact/hooks";
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { useSyncExternalStore } from "preact/compat";

/**
 * 订阅代理对象并返回其当前快照，内部状态变化经 subscribe 通知后触发重渲染。
 * 订阅与快照读取分别按 source 引用缓存，使传给 useSyncExternalStore 的函数引用稳定，避免每次渲染重复退订/重订。
 * @typeParam T 被代理的对象类型，约束为 object
 * @param source 由 @slux/proxy 创建的代理对象，应传入稳定引用
 * @returns 当前快照
 * @remarks 第三个参数作为服务端渲染快照，SSR 阶段直接读取 snapshot(source) 而不建立订阅
 * @see useAtomValue
 */
export function useSnapshot<T extends object>(source: T): Snapshot<T> {
  const sub = useCallback((notify: () => void) => subscribe(source, notify), [source]);
  const getSnapshot = useCallback(() => snapshot(source), [source]);

  return useSyncExternalStore(sub, getSnapshot, getSnapshot);
}
