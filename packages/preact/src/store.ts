import { useCallback, useMemo } from "preact/hooks";
import type { StoreApi } from "@slux/store";
import { useSyncExternalStore } from "preact/compat";

export function useStore<State extends object>(store: StoreApi<State>): State;
export function useStore<State extends object, Selection>(
  store: StoreApi<State>,
  selector: (state: State) => Selection,
  equalityFn?: (previous: Selection, next: Selection) => boolean,
): Selection;
export function useStore<State extends object, Selection>(
  store: StoreApi<State>,
  selector?: (state: State) => Selection,
  equalityFn: (previous: Selection, next: Selection) => boolean = Object.is,
): State | Selection {
  const subscribe = useCallback((notify: () => void) => store.subscribe(notify), [store]);
  const getSnapshot = useMemo(() => {
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
  }, [store, selector, equalityFn]);
  return useSyncExternalStore<State | Selection>(subscribe, getSnapshot, getSnapshot);
}
