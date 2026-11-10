import { getDefaultScope } from "./atom-scope.js";
import { configs } from "./internals.js";
import type { Atom } from "./types.js";

export function atom<T>(initialValue: T): Atom<T> {
  const value: Atom<T> = {
    get: () => getDefaultScope().get(value),
    set: (next) => getDefaultScope().set(value, next),
    update: (fn) => value.set(fn(value.get())),
    subscribe: (callback) => getDefaultScope().sub(value, callback),
  };
  configs.set(value, { kind: "base", initialValue });
  return value;
}
