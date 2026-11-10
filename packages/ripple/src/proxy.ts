import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import type { Derived } from "ripple";
import { useExternal } from "./external.js";

export function useSnapshot<T extends object>(proxy: T): Derived<Snapshot<T>> {
  return useExternal(
    () => snapshot(proxy),
    (notify) => subscribe(proxy, notify),
  );
}
