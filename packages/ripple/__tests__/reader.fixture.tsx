import { provideScope, useSignal } from "@slux/ripple";
import type { Scope, Subscribable } from "@slux/core";

export function CompiledReader({ source, scope }: { source: Subscribable<number>; scope?: Scope }) {
  if (scope) provideScope(scope);
  const value = useSignal(source);
  return <output>{value.value}</output>;
}
