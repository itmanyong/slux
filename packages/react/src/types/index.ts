import type { Scope } from "@slux/core";
import type { ReactNode } from "react";

export type ScopeProviderProps = {
  readonly scope: Scope;
  readonly children: ReactNode;
};
