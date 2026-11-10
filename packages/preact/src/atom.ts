import { useCallback } from "preact/hooks";
import { useSyncExternalStore } from "preact/compat";
import { effect } from "@slux/core";
import type { Atom, AnyReadableAtom } from "@slux/atom";

export function useAtomValue<T>(source: AnyReadableAtom<T>): T {
  const subscribe = useCallback(
    (notify: () => void) => {
      const unsubscribe = source.subscribe(notify);
      const dispose = effect(() => {
        source.get();
      });
      return () => {
        unsubscribe();
        dispose();
      };
    },
    [source],
  );
  const getSnapshot = useCallback(() => source.get(), [source]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
export function useSetAtom<T>(source: Atom<T>): (value: T) => void {
  return useCallback((value: T) => source.set(value), [source]);
}
export function useAtom<T>(source: Atom<T>): [T, (value: T) => void] {
  return [useAtomValue(source), useSetAtom(source)];
}
