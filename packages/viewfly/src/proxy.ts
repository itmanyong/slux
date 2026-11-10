import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import type { Accessor } from "./binding.js";
import { bindExternal } from "./binding.js";
export function useSnapshot<T extends object>(proxy: T): Accessor<Snapshot<T>> {
  return bindExternal(
    () => snapshot(proxy),
    (notify) => subscribe(proxy, notify),
  );
}
