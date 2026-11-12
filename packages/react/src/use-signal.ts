/**
 * @file 把 @slux/core 的 Subscribable 接入 React useSyncExternalStore 的核心 hook，
 * 供 atom / flux / rxjs 等适配 hook 复用。
 */

import { useCallback, useSyncExternalStore } from "react";
import { effect } from "@slux/core";
import type { Subscribable } from "@slux/core";
import { useScopeContext } from "./scope-context.js";

/**
 * 订阅任意 Subscribable 并返回其当前值，值变化经订阅链与 core effect 通知后触发重渲染。
 * @typeParam T Subscribable 承载的值类型。
 * @param source 可读且可订阅的数据源；应传入稳定引用，引用变化会重建订阅。
 * @returns 当前值 T。
 * @remarks 之所以在 source.subscribe 之外再建立 core effect，是因为 computed 派生值
 *          只有被读取时才刷新并通知，effect 把其依赖变化接入外部订阅，保证派生值更新
 *          也能驱动重渲染。清理时先退订 source、再 dispose effect。SSR 快照在存在
 *          显式作用域时按作用域取值，否则回退全局值。
 * @see useAtomValue
 * @see useSnapshot
 */
export function useSignal<T>(source: Subscribable<T>): T {
  const scope = useScopeContext();

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const unsubscribe = source.subscribe(() => onStoreChange());
      const dispose = effect(() => {
        source.get();
      });
      return () => {
        unsubscribe();
        dispose();
      };
    },
    [source],
  );

  const getSnapshot = useCallback(() => source.get(), [source]);
  const getServerSnapshot = useCallback(() => (scope ? scope.get(source) : source.get()), [scope, source]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
