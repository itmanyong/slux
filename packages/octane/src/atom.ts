import { useCallback, useSyncExternalStore } from "octane";
import type { Atom, AnyReadableAtom } from "@slux/atom";
import { subSlot } from "./slots.js";

export function useAtom<T>(atom: Atom<T>, slot?: symbol): [T, (value: T) => void] {
  return [useAtomValue(atom, subSlot(slot, "atom:value")), useSetAtom(atom, subSlot(slot, "atom:setter"))];
}

export function useAtomValue<T>(atom: AnyReadableAtom<T>, slot?: symbol): T {
  const subscribe = useCallback((notify: () => void) => atom.subscribe(notify), [atom], subSlot(slot, "atom:subscribe"));
  const getSnapshot = useCallback(() => atom.get(), [atom], subSlot(slot, "atom:read"));
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot, subSlot(slot, "atom:store"));
}

export function useSetAtom<T>(atom: Atom<T>, slot?: symbol): (value: T) => void {
  return useCallback((value: T) => atom.set(value), [atom], subSlot(slot, "atom:write"));
}
