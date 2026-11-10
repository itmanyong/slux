import type { Ref } from "vue";
import type { StoreApi } from "@slux/store";
import { useSignal } from "./use-signal.js";

export function useStore<T>(store: StoreApi<T>): Readonly<Ref<T>>;
export function useStore<T, U>(store: StoreApi<T>, selector: (state: T) => U, equals?: (a: U, b: U) => boolean): Readonly<Ref<U>>;
export function useStore<T, U = T>(
  store: StoreApi<T>,
  selector?: (state: T) => U,
  equals: (a: U, b: U) => boolean = Object.is,
): Readonly<Ref<U>> {
  const select = selector ?? ((state: T) => state as unknown as U);
  let current = select(store.getState());
  const read = () => {
    const next = select(store.getState());
    if (!equals(current, next)) current = next;
    return current;
  };
  return useSignal({
    get: read,
    subscribe: (callback) => store.subscribe(() => callback(read())),
  });
}
