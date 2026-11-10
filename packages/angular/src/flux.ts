import type { Signal } from "@angular/core";
import type { FluxAction, FluxStore } from "@slux/flux";
import { toAngularSignal } from "./bridge.js";
import type { ToAngularSignalOptions } from "./bridge.js";

export function injectFluxStore<State, Action extends FluxAction>(
  store: FluxStore<State, Action>,
  options?: ToAngularSignalOptions<State>,
): Signal<State> {
  return toAngularSignal(store, options);
}
