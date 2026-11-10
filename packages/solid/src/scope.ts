import { createContext, useContext } from "solid-js";
import type { JSX } from "solid-js";
import type { Scope } from "@slux/core";

export type ScopeProviderProps = {
  readonly scope: Scope;
  readonly children: JSX.Element;
};
export const ScopeContext = createContext<Scope>();
export function ScopeProvider(props: ScopeProviderProps): JSX.Element {
  return ScopeContext.Provider({
    value: props.scope,
    get children() {
      return props.children;
    },
  });
}
export function useScope(): Scope | undefined {
  return useContext(ScopeContext);
}
