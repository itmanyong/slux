import type { Readable } from "svelte/store";
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { toReadable } from "./signal.js";

export function toSnapshot<T extends object>(proxy: T): Readable<Snapshot<T>> {
  return toReadable({
    get: () => snapshot(proxy),
    subscribe: (callback) => subscribe(proxy, () => callback(snapshot(proxy))),
  });
}
