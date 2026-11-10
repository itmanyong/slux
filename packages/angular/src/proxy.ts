import type { Signal } from "@angular/core";
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { toAngularSignal } from "./bridge.js";
import type { ToAngularSignalOptions } from "./bridge.js";

export function injectSnapshot<T extends object>(source: T, options?: ToAngularSignalOptions<Snapshot<T>>): Signal<Snapshot<T>> {
  return toAngularSignal(
    {
      get: () => snapshot(source),
      subscribe: (notify) => subscribe(source, () => notify(snapshot(source))),
    },
    options,
  );
}
