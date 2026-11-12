/**
 * @file 把 @slux/store 的 StoreApi 接入 React useSyncExternalStore，提供整状态
 * 与带选择器的派生读取两种重载。
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { StoreApi } from "@slux/store";

/**
 * 读取整个 store 状态的重载：不传 selector 时直接返回 State。
 * @typeParam State store 状态类型。
 * @param store StoreApi 实例；应传入稳定引用。
 * @returns 当前整状态 State。
 */
export function useStore<State extends object>(store: StoreApi<State>): State;
/**
 * 带选择器读取派生值的重载：selector 从整状态中选取 Selection，equalityFn 判定两次结果是否等价。
 * @typeParam State store 状态类型。
 * @typeParam Selection selector 的输出类型。
 * @param store StoreApi 实例；应传入稳定引用。
 * @param selector 从 State 映射到 Selection 的函数；引用变化会重建快照缓存。
 * @param equalityFn 比较上一次与本次选择结果的函数；省略时默认 Object.is。
 * @returns 当前选择结果 Selection。
 */
export function useStore<State extends object, Selection>(
  store: StoreApi<State>,
  selector: (state: State) => Selection,
  equalityFn?: (previous: Selection, next: Selection) => boolean,
): Selection;
/**
 * useStore 的实现签名：合并整状态读取与带选择器读取两条路径。
 * 存在 selector 时用 useMemo 内的局部缓存保存「上一次 state 与选择结果」，
 * 让 getSnapshot 在状态未变时返回稳定引用，避免等价结果被判定为变化。
 * @param store StoreApi 实例；应传入稳定引用。
 * @param selector 可选的派生函数；为空时走整状态路径。
 * @param equalityFn 选择结果的等价比较器，默认 Object.is。
 * @returns 整状态 State（无 selector）或选择结果 Selection。
 */
export function useStore<State extends object, Selection>(
  store: StoreApi<State>,
  selector?: (state: State) => Selection,
  equalityFn: (previous: Selection, next: Selection) => boolean = Object.is,
): State | Selection {
  const subscribe = useCallback((onStoreChange: () => void) => store.subscribe(onStoreChange), [store]);

  const getSnapshot = useMemo(() => {
    if (!selector) return () => store.getState();

    let cache: { state: State; selection: Selection } | undefined;
    return () => {
      const state = store.getState();
      // state 引用未变时直接复用旧选择结果，避免重复执行 selector。
      if (cache && Object.is(cache.state, state)) return cache.selection;
      const next = selector(state);
      // 等价时复用旧 selection 引用，保持快照引用稳定。
      const selection = cache && equalityFn(cache.selection, next) ? cache.selection : next;
      cache = { state, selection };
      return selection;
    };
  }, [store, selector, equalityFn]);

  return useSyncExternalStore<State | Selection>(subscribe, getSnapshot, getSnapshot);
}
