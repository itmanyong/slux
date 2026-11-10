import type { Signal } from "@angular/core";
import type { ObservableState } from "@slux/rxjs";
import { toAngularSignal } from "./bridge.js";
import type { ToAngularSignalOptions } from "./bridge.js";

export function injectObservable<T>(source: ObservableState<T>, options?: ToAngularSignalOptions<T>): Signal<T> {
  return toAngularSignal(source, options);
}
