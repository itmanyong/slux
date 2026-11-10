import { createContext, createElement } from "preact";
import type { ComponentChildren } from "preact";
import { useCallback, useContext } from "preact/hooks";
import { useSyncExternalStore } from "preact/compat";
import { effect } from "@slux/core";
import type { Scope, Subscribable } from "@slux/core";

export const ScopeContext = createContext<Scope | null>(null);
export type ScopeProviderProps = { scope: Scope; children?: ComponentChildren };
export function ScopeProvider({ scope, children }: ScopeProviderProps) {
  return createElement(ScopeContext.Provider, { value: scope }, children);
}
export function useScopeContext(): Scope | null {
  return useContext(ScopeContext);
}
export function useSignal<T>(source: Subscribable<T>): T {
  const scope = useScopeContext();
  const subscribe = useCallback(
    (notify: () => void) => {
      const unsubscribe = source.subscribe(notify);
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
export { createAutoImportApis } from "./auto-import-api.js";
