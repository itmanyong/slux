import type { Subscribable } from "@slux/core";

export type AtomGetter = <Value>(atom: Subscribable<Value>) => Value;
export type AtomSetter = <Value>(atom: Atom<Value>, value: Value) => void;

export type Atom<T> = Subscribable<T> & {
  set(value: T): void;
  update(fn: (current: T) => T): void;
};

export type ReadonlyAtom<T> = Subscribable<T>;

export type WritableAtom<Value, Args extends unknown[], Result> = Subscribable<Value> & {
  write(...args: Args): Result;
};

export type AnyReadableAtom<T = unknown> = Atom<T> | ReadonlyAtom<T> | WritableAtom<T, unknown[], unknown>;

export type AtomScope = {
  get<T>(atom: AnyReadableAtom<T>): T;
  set<T>(atom: Atom<T>, value: T): void;
  sub<T>(atom: AnyReadableAtom<T>, callback: (value: T) => void): () => void;
};
