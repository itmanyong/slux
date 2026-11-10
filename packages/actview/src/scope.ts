import { provide, useInjects } from "@actview/core";
import type { Scope } from "@slux/core";
export const SCOPE_KEY = Symbol.for("slux.actview.scope");
export function provideScope(scope: Scope): void {
  provide(SCOPE_KEY, scope);
}
export function useScope(): Scope | undefined {
  return useInjects(SCOPE_KEY) as Scope | undefined;
}
