import { provide, inject } from "vitarx";
import type { Scope } from "@slux/core";
export const SCOPE_KEY = Symbol.for("slux.vitarx.scope");
export function provideScope(scope: Scope): void {
  provide(SCOPE_KEY, scope);
}
export function useScope(): Scope | undefined {
  return inject<Scope>(SCOPE_KEY);
}
