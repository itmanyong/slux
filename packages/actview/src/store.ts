import type { StoreApi } from "@slux/store";
import type { Ref } from "@actview/core";
import { bindExternal } from "./binding.js";
export function useStore<T>(store: StoreApi<T>): Readonly<Ref<T>>;
export function useStore<T, S>(store: StoreApi<T>, selector: (state: T) => S, equals?: (a: S, b: S) => boolean): Readonly<Ref<S>>;
export function useStore<T, S = T>(
  store: StoreApi<T>,
  selector: (state: T) => S = (state) => state as unknown as S,
  equals: (a: S, b: S) => boolean = Object.is,
): Readonly<Ref<S>> {
  return bindExternal(
    () => selector(store.getState()),
    (notify) => store.subscribe(notify),
    equals,
  );
}
