import { Context } from "ripple";
import type { Scope } from "@slux/core";

export const ScopeContext = new Context<Scope | null>(null);

export function provideScope(scope: Scope): void {
  ScopeContext.set(scope);
}

export function useScopeContext(): Scope | null {
  return ScopeContext.get();
}
