import type { StoreApi } from "@slux/store";
import type { Derived } from "ripple";
import { useExternal } from "./external.js";

export function useStore<State extends object>(store: StoreApi<State>): Derived<State>;
export function useStore<State extends object, Selection>(
  store: StoreApi<State>,
  selector: (state: State) => Selection,
  equalityFn?: (previous: Selection, next: Selection) => boolean,
): Derived<Selection>;
export function useStore<State extends object, Selection>(
  store: StoreApi<State>,
  selector?: (state: State) => Selection,
  equalityFn: (previous: Selection, next: Selection) => boolean = Object.is,
): Derived<State | Selection> {
  let cache: { state: State; selection: Selection } | undefined;
  return useExternal(
    () => {
      const state = store.getState();
      if (!selector) return state;
      if (cache && Object.is(cache.state, state)) return cache.selection;
      const next = selector(state);
      const selection = cache && equalityFn(cache.selection, next) ? cache.selection : next;
      cache = { state, selection };
      return selection;
    },
    (notify) => store.subscribe(notify),
  );
}
