import type { Atom, AnyReadableAtom } from "@slux/atom";
import type { Derived } from "ripple";
import { useExternal } from "./external.js";

export function useAtom<T>(atom: Atom<T>): [Derived<T>, (value: T) => void] {
  return [useAtomValue(atom), useSetAtom(atom)];
}

export function useAtomValue<T>(atom: AnyReadableAtom<T>): Derived<T> {
  return useExternal(
    () => atom.get(),
    (notify) => atom.subscribe(notify),
  );
}

export function useSetAtom<T>(atom: Atom<T>): (value: T) => void {
  return (value) => atom.set(value);
}
