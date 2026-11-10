import type { Atom, ReadonlyAtom } from "@slux/atom";
import type { Accessor } from "./binding.js";
import { useSignal } from "./use-signal.js";
export function useAtomValue<T>(atom: ReadonlyAtom<T>): Accessor<T> {
  return useSignal(atom);
}
export function useSetAtom<T>(atom: Atom<T>): (value: T) => void {
  return (value) => atom.set(value);
}
export function useAtom<T>(atom: Atom<T>): readonly [Accessor<T>, (value: T) => void] {
  return [useAtomValue(atom), useSetAtom(atom)];
}
