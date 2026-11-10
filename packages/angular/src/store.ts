import type { Signal } from "@angular/core";
import type { StoreApi } from "@slux/store";
import { toAngularSignal } from "./bridge.js";
import type { ToAngularSignalOptions } from "./bridge.js";

export type InjectStoreOptions<T> = ToAngularSignalOptions<T>;
export function injectStore<State extends object>(store: StoreApi<State>, options?: InjectStoreOptions<State>): Signal<State>;
export function injectStore<State extends object, Selection>(
  store: StoreApi<State>,
  selector: (state: State) => Selection,
  options?: InjectStoreOptions<Selection>,
): Signal<Selection>;
export function injectStore<State extends object, Selection = State>(
  store: StoreApi<State>,
  selectorOrOptions?: ((state: State) => Selection) | InjectStoreOptions<State>,
  options?: InjectStoreOptions<Selection>,
): Signal<State | Selection> {
  if (typeof selectorOrOptions !== "function") return toAngularSignal(store, selectorOrOptions);
  const selector = selectorOrOptions;
  return toAngularSignal(
    {
      get: () => selector(store.getState()),
      subscribe: (notify) => store.subscribe((state) => notify(selector(state))),
    },
    options,
  );
}
