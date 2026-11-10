import { createContextProvider, inject, InjectionToken } from "@viewfly/core";
import type { Scope } from "@slux/core";
export const SLUX_SCOPE = new InjectionToken<Scope>("slux.viewfly.scope");
export const ScopeProvider = createContextProvider({ provide: SLUX_SCOPE });
export function useScope(): Scope | undefined {
  return inject(SLUX_SCOPE, undefined);
}
