import { getDefaultScope } from "./atom-scope.js";
import { configs } from "./internals.js";
import type { AtomGetter, ReadonlyAtom } from "./types.js";

export function derived<T>(read: (get: AtomGetter) => T): ReadonlyAtom<T> {
  const value: ReadonlyAtom<T> = {
    get: () => getDefaultScope().get(value),
    subscribe: (callback) => getDefaultScope().sub(value, callback),
  };
  configs.set(value, { kind: "derived", read });
  return value;
}
