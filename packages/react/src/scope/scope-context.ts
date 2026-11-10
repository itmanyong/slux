import { createContext, createElement, useContext } from "react";
import type { Scope } from "@slux/core";
import type { ScopeProviderProps } from "../types/index.js";

export const ScopeContext = createContext<Scope | null>(null);

export function ScopeProvider({ scope, children }: ScopeProviderProps) {
  return createElement(ScopeContext.Provider, { value: scope }, children);
}

export function useScopeContext(): Scope | null {
  return useContext(ScopeContext);
}
