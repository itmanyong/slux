import { createContext, createElement, useContext } from "octane";
import type { OctaneNode } from "octane";
import type { Scope } from "@slux/core";

export type ScopeProviderProps = {
  readonly scope: Scope;
  readonly children?: OctaneNode;
};
export const ScopeContext = createContext<Scope | null>(null);

export function ScopeProvider({ scope, children }: ScopeProviderProps) {
  return createElement(ScopeContext, { value: scope, children });
}

export function useScopeContext(): Scope | null {
  return useContext(ScopeContext);
}
