import type { Ref } from "vue";
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { useSignal } from "./use-signal.js";

export function useSnapshot<T extends object>(proxy: T): Readonly<Ref<Snapshot<T>>> {
  return useSignal({
    get: () => snapshot(proxy),
    subscribe: (callback) => subscribe(proxy, () => callback(snapshot(proxy))),
  });
}
