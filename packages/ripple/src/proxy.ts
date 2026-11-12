/**
 * @file Ripple 适配层的 proxy 快照 hook：把 @slux/proxy 的 snapshot/subscribe 包装为
 * Derived<Snapshot<T>>，不提供写入接口。
 */

import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import type { Derived } from "ripple";
import { useExternal } from "./external.js";

/**
 * 把代理对象转换为 Ripple 的 Derived；proxy 变化经 useExternal 触发派生值更新。
 * @typeParam T 被代理的对象类型，快照类型由 Snapshot<T> 映射
 * @param proxy 由 @slux/proxy 创建的代理对象，应传入稳定引用
 * @returns Derived<Snapshot<T>>
 * @see useExternal
 */
export function useSnapshot<T extends object>(proxy: T): Derived<Snapshot<T>> {
  return useExternal(
    () => snapshot(proxy),
    (notify) => subscribe(proxy, notify),
  );
}
