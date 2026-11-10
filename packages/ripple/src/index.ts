import { effect } from "@slux/core";
import type { Subscribable } from "@slux/core";
import type { Derived } from "ripple";
import { useExternal } from "./external.js";

export { ScopeContext, provideScope, useScopeContext } from "./scope.js";

export function useSignal<T>(source: Subscribable<T>): Derived<T> {
  return useExternal(
    () => source.get(),
    (notify) => {
      const unsubscribe = source.subscribe(notify);
      // computed 需要活跃读取才能向订阅者发布最新值。
      const dispose = effect(() => {
        source.get();
      });
      return () => {
        unsubscribe();
        dispose();
      };
    },
  );
}
export { createAutoImportApis } from "./auto-import-api.js";
