import { batch } from "@slux/core";
import { getDefaultScope } from "./atom-scope.js";
import { configs } from "./internals.js";
import type { AtomGetter, AtomSetter, WritableAtom } from "./types.js";

export function writableAtom<Args extends unknown[], Result>(
  read: null,
  write: (get: AtomGetter, set: AtomSetter, ...args: Args) => Result,
): WritableAtom<null, Args, Result>;
export function writableAtom<Value, Args extends unknown[], Result>(
  read: ((get: AtomGetter) => Value) | null,
  write: (get: AtomGetter, set: AtomSetter, ...args: Args) => Result,
): WritableAtom<Value, Args, Result>;
export function writableAtom<Value, Args extends unknown[], Result>(
  read: ((get: AtomGetter) => Value) | null,
  write: (get: AtomGetter, set: AtomSetter, ...args: Args) => Result,
): WritableAtom<Value | null, Args, Result> {
  const value: WritableAtom<Value | null, Args, Result> = {
    get: () => getDefaultScope().get(value),
    subscribe: (callback) => getDefaultScope().sub(value, callback),
    write: (...args) => {
      const scope = getDefaultScope();
      return batch(() =>
        write(
          (atom) => scope.get(atom),
          (atom, next) => scope.set(atom, next),
          ...args,
        ),
      );
    },
  };
  configs.set(value, read === null ? { kind: "base", initialValue: null } : { kind: "derived", read });
  return value;
}
