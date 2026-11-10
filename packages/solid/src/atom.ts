import type { Accessor } from "solid-js";
import type { AnyReadableAtom, Atom } from "@slux/atom";
import { useSignal } from "./use-signal.js";

export function useAtomValue<T>(atom: AnyReadableAtom<T>): Accessor<T> {
  return useSignal(atom);
}
export function useSetAtom<T>(atom: Atom<T>): (value: T) => void {
  return (value) => atom.set(value);
}
export function useAtom<T>(atom: Atom<T>): [Accessor<T>, (value: T) => void] {
  return [useAtomValue(atom), useSetAtom(atom)];
}
