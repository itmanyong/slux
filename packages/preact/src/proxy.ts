import { useCallback } from "preact/hooks";
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { useSyncExternalStore } from "preact/compat";

export function useSnapshot<T extends object>(source: T): Snapshot<T> {
  const sub = useCallback((notify: () => void) => subscribe(source, notify), [source]);
  const getSnapshot = useCallback(() => snapshot(source), [source]);
  return useSyncExternalStore(sub, getSnapshot, getSnapshot);
}
