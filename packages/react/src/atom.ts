import { useCallback, useSyncExternalStore } from "react";
import type { Atom, AnyReadableAtom } from "@slux/atom";

export function useAtom<T>(atom: Atom<T>): [T, (value: T) => void] {
  return [useAtomValue(atom), useSetAtom(atom)];
}

export function useAtomValue<T>(atom: AnyReadableAtom<T>): T {
  // atom 包已主动刷新派生值，无需额外创建 core effect。
  const subscribe = useCallback((onStoreChange: () => void) => atom.subscribe(onStoreChange), [atom]);
  const getSnapshot = useCallback(() => atom.get(), [atom]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useSetAtom<T>(atom: Atom<T>): (value: T) => void {
  return useCallback((value: T) => atom.set(value), [atom]);
}
