import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import type { ShallowRef } from "vitarx";
import { bindExternal } from "./binding.js";
export function useSnapshot<T extends object>(proxy: T): Readonly<ShallowRef<Snapshot<T>>> {
  return bindExternal(
    () => snapshot(proxy),
    (notify) => subscribe(proxy, notify),
  );
}
