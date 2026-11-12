/**
 * @file octane 适配层公共入口：提供 useSignal hook，把 Subscribable 接入 useSyncExternalStore，并汇总本包各 API。
 */

import { useCallback, useSyncExternalStore } from "octane";
import { effect } from "@slux/core";
import type { Subscribable } from "@slux/core";
import { useScopeContext } from "./scope.js";
import { subSlot } from "./slots.js";

export { ScopeContext, ScopeProvider, useScopeContext } from "./scope.js";
export type { ScopeProviderProps } from "./scope.js";

/**
 * 把 Subscribable<T> 的当前值接入 useSyncExternalStore，使组件随其值更新。
 * @typeParam T 数据源持有的值类型
 * @param source 被读取的 Subscribable 实例
 * @param slot 可选的 symbol 槽标识，经 subSlot 派生各内部调用的槽位
 * @returns 当前值 T
 * @remarks 订阅函数在建立 source 订阅的同时保持一个 effect，以持续刷新依赖——
 *          core 的 computed 按读取刷新，effect 停止后不再追踪变化。订阅清理由 useSyncExternalStore 在卸载或重订阅时执行。
 * @see useScopeContext 读取可选 Scope 的 hook
 */
export function useSignal<T>(source: Subscribable<T>, slot?: symbol): T {
  const scope = useScopeContext();
  const subscribe = useCallback(
    (notify: () => void) => {
      const unsubscribe = source.subscribe(notify);
      // core 的 computed 按读取刷新，effect 须保持存活才能持续追踪依赖变化。
      const dispose = effect(() => {
        source.get();
      });
      return () => {
        unsubscribe();
        dispose();
      };
    },
    [source],
    subSlot(slot, "signal:subscribe"),
  );
  const getSnapshot = useCallback(() => source.get(), [source], subSlot(slot, "signal:read"));
  const getServerSnapshot = useCallback(() => (scope ? scope.get(source) : source.get()), [scope, source], subSlot(slot, "signal:server"));
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot, subSlot(slot, "signal:value"));
}
export { createAutoImportApis } from "./auto-import-api.js";
