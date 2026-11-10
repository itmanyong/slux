import type { AtomGetter } from "./types.js";

type AtomConfig =
  { readonly kind: "base"; readonly initialValue: unknown } | { readonly kind: "derived"; readonly read: (get: AtomGetter) => unknown };

export const configs = new WeakMap<object, AtomConfig>();
