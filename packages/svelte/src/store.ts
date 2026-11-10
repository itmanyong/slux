import { readable } from "svelte/store";
import type { Readable } from "svelte/store";
import type { StoreApi } from "@slux/store";

export function toStore<T>(store: StoreApi<T>): Readable<T>;
export function toStore<T, U>(store: StoreApi<T>, selector: (state: T) => U, equals?: (a: U, b: U) => boolean): Readable<U>;
export function toStore<T, U = T>(store: StoreApi<T>, selector?: (state: T) => U, equals: (a: U, b: U) => boolean = Object.is): Readable<U> {
  const select = selector ?? ((state: T) => state as unknown as U);
  return readable(select(store.getState()), (set) => {
    let current = select(store.getState());
    set(current);
    return store.subscribe((state) => {
      const next = select(state);
      if (!equals(current, next)) {
        current = next;
        set(next);
      }
    });
  });
}
