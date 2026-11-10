import { getContext, setContext } from "svelte";
import type { Scope } from "@slux/core";

export const SCOPE_KEY: unique symbol = Symbol("slux-scope");
export function setScope(scope: Scope): void {
  setContext(SCOPE_KEY, scope);
}
export function getScope(): Scope | undefined {
  return getContext<Scope | undefined>(SCOPE_KEY);
}
