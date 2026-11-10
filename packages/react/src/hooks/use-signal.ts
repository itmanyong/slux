import { useCallback, useSyncExternalStore } from "react";
import { effect } from "@slux/core";
import type { Subscribable } from "@slux/core";
import { useScopeContext } from "../scope/scope-context.js";

export function useSignal<T>(source: Subscribable<T>): T {
  const scope = useScopeContext();
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const unsubscribe = source.subscribe(() => onStoreChange());
      // computed 只有读取时才刷新并通知；effect 将依赖变化接入外部订阅。
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
  // 对齐 core 的显式作用域契约：客户端正常渲染仍读取全局值。
  const getServerSnapshot = useCallback(() => (scope ? scope.get(source) : source.get()), [scope, source]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
