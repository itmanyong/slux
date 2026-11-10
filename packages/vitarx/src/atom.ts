import type { Atom, ReadonlyAtom } from "@slux/atom";
import type { ShallowRef } from "vitarx";
import { useSignal } from "./use-signal.js";
export function useAtomValue<T>(atom: ReadonlyAtom<T>): Readonly<ShallowRef<T>> {
  return useSignal(atom);
}
export function useSetAtom<T>(atom: Atom<T>): (value: T) => void {
  return (value) => atom.set(value);
}
export function useAtom<T>(atom: Atom<T>): readonly [Readonly<ShallowRef<T>>, (value: T) => void] {
  return [useAtomValue(atom), useSetAtom(atom)];
}
