import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { StoreApi } from "@slux/store";

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
  const subscribe = useCallback((onStoreChange: () => void) => store.subscribe(onStoreChange), [store]);
  const getSnapshot = useMemo(() => {
    if (!selector) return () => store.getState();

    // 缓存随 store、selector 和比较器更换而重建，不在并发渲染间共享可写 ref。
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
