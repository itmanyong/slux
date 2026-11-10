import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import type { Ref } from "@actview/core";
import { bindExternal } from "./binding.js";
export function useSnapshot<T extends object>(proxy: T): Readonly<Ref<Snapshot<T>>> {
  return bindExternal(
    () => snapshot(proxy),
    (notify) => subscribe(proxy, notify),
  );
}
