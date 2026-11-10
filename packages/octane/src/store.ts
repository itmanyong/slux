import { useCallback, useMemo, useSyncExternalStore } from "octane";
import type { StoreApi } from "@slux/store";
import { subSlot } from "./slots.js";

export function useStore<State extends object>(store: StoreApi<State>, slot?: symbol): State;
export function useStore<State extends object, Selection>(
  store: StoreApi<State>,
  selector: (state: State) => Selection,
  equalityFn?: (previous: Selection, next: Selection) => boolean,
  slot?: symbol,
): Selection;
export function useStore<State extends object, Selection>(
  store: StoreApi<State>,
  selectorOrSlot?: ((state: State) => Selection) | symbol,
  equalityOrSlot?: ((previous: Selection, next: Selection) => boolean) | symbol,
  explicitSlot?: symbol,
): State | Selection {
  const slot = typeof selectorOrSlot === "symbol" ? selectorOrSlot : typeof equalityOrSlot === "symbol" ? equalityOrSlot : explicitSlot;
  const selector = typeof selectorOrSlot === "function" ? selectorOrSlot : undefined;
  const equalityFn = typeof equalityOrSlot === "function" ? equalityOrSlot : Object.is;
  const subscribe = useCallback((notify: () => void) => store.subscribe(notify), [store], subSlot(slot, "store:subscribe"));
  const getSnapshot = useMemo(
    () => {
      if (!selector) return () => store.getState();
      let cache: { state: State; selection: Selection } | undefined;
      return () => {
        const state = store.getState();
        if (cache && Object.is(cache.state, state)) return cache.selection;
        const next = selector(state);
        const selection = cache && equalityFn(cache.selection, next) ? cache.selection : next;
        cache = { state, selection };
        return selection;
      };
    },
    [store, selector, equalityFn],
    subSlot(slot, "store:read"),
  );
  return useSyncExternalStore<State | Selection>(subscribe, getSnapshot, getSnapshot, subSlot(slot, "store:value"));
}
