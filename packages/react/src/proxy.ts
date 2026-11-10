import { useCallback, useSyncExternalStore } from "react";
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";

export function useSnapshot<T extends object>(proxy: T): Snapshot<T> {
  const sub = useCallback((onStoreChange: () => void) => subscribe(proxy, onStoreChange), [proxy]);
  const getSnapshot = useCallback(() => snapshot(proxy), [proxy]);
  return useSyncExternalStore(sub, getSnapshot, getSnapshot);
}
