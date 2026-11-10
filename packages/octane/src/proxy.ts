import { useCallback, useSyncExternalStore } from "octane";
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { subSlot } from "./slots.js";

export function useSnapshot<T extends object>(proxy: T, slot?: symbol): Snapshot<T> {
  const sub = useCallback((notify: () => void) => subscribe(proxy, notify), [proxy], subSlot(slot, "proxy:subscribe"));
  const getSnapshot = useCallback(() => snapshot(proxy), [proxy], subSlot(slot, "proxy:read"));
  return useSyncExternalStore(sub, getSnapshot, getSnapshot, subSlot(slot, "proxy:value"));
}
