/**
 * @file octane 适配层的 proxy 快照 hook：把 @slux/proxy 源的快照经 useSyncExternalStore 暴露给组件。
 */

import { useCallback, useSyncExternalStore } from "octane";
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { subSlot } from "./slots.js";

/**
 * 读取 proxy 源的当前快照并订阅其变化，使组件随快照更新。
 * @typeParam T proxy 源对象类型，约束为 object
 * @param proxy 被读取的 proxy 源对象
 * @param slot 可选的 symbol 槽标识
 * @returns 当前快照 Snapshot<T>
 * @remarks 订阅与读取函数以 [proxy] 记忆化；订阅清理由 useSyncExternalStore 管理
 * @see subSlot 生成各 hook 所需槽标识的辅助函数
 */
export function useSnapshot<T extends object>(proxy: T, slot?: symbol): Snapshot<T> {
  const sub = useCallback((notify: () => void) => subscribe(proxy, notify), [proxy], subSlot(slot, "proxy:subscribe"));
  const getSnapshot = useCallback(() => snapshot(proxy), [proxy], subSlot(slot, "proxy:read"));
  return useSyncExternalStore(sub, getSnapshot, getSnapshot, subSlot(slot, "proxy:value"));
}
