import type { Readable, Writable } from "svelte/store";
import type { AnyReadableAtom, Atom } from "@slux/atom";
import { toReadable } from "./signal.js";

export function toAtomValue<T>(atom: AnyReadableAtom<T>): Readable<T> {
  return toReadable(atom);
}
export function toAtom<T>(atom: Atom<T>): Writable<T> {
  return {
    subscribe: toAtomValue(atom).subscribe,
    set: (value) => atom.set(value),
    update: (fn) => atom.update(fn),
  };
}
