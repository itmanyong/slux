import { useCallback, useSyncExternalStore } from "octane";
import { effect } from "@slux/core";
import type { Subscribable } from "@slux/core";
import { useScopeContext } from "./scope.js";
import { subSlot } from "./slots.js";

export { ScopeContext, ScopeProvider, useScopeContext } from "./scope.js";
export type { ScopeProviderProps } from "./scope.js";

export function useSignal<T>(source: Subscribable<T>, slot?: symbol): T {
  const scope = useScopeContext();
  const subscribe = useCallback(
    (notify: () => void) => {
      const unsubscribe = source.subscribe(notify);
      // core computed 按读取刷新，保持 effect 才能持续接收依赖变化。
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
