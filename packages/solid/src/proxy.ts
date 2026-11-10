import type { Accessor } from "solid-js";
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { useSignal } from "./use-signal.js";

export function useSnapshot<T extends object>(proxy: T): Accessor<Snapshot<T>> {
  return useSignal({
    get: () => snapshot(proxy),
    subscribe: (callback) => subscribe(proxy, () => callback(snapshot(proxy))),
  });
}
