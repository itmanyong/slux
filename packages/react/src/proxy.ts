/**
 * @file 把 @slux/proxy 的 subscribe / snapshot 接入 React useSyncExternalStore，
 * 提供 useSnapshot 读取代理对象的当前快照。
 */

import { useCallback, useSyncExternalStore } from "react";
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";

/**
 * 订阅代理对象并返回其当前快照；proxy 内部状态变化经 subscribe 通知后触发重渲染。
 * @typeParam T 被代理的对象类型；快照类型由 Snapshot<T> 映射。
 * @param proxy 由 @slux/proxy 创建的代理对象；应传入稳定引用，引用变化会重建订阅。
 * @returns 当前快照 Snapshot<T>。
 * @remarks 订阅与快照读取分别按 proxy 引用缓存，保持 useSyncExternalStore 入参稳定，
 *          避免每次渲染重复退订/重订。SSR 阶段直接读取 snapshot(proxy) 而不建立订阅。
 * @see useAtomValue
 */
export function useSnapshot<T extends object>(proxy: T): Snapshot<T> {
  const sub = useCallback((onStoreChange: () => void) => subscribe(proxy, onStoreChange), [proxy]);
  const getSnapshot = useCallback(() => snapshot(proxy), [proxy]);

  return useSyncExternalStore(sub, getSnapshot, getSnapshot);
}
