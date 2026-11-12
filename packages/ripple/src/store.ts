/**
 * @file Ripple 适配层的 store hook：把 @slux/store 的 StoreApi 包装为 Derived，
 * 提供整状态与带选择器两种重载。
 */

import type { StoreApi } from "@slux/store";
import type { Derived } from "ripple";
import { useExternal } from "./external.js";

/**
 * 读取整个 store 状态的重载。
 * @typeParam State store 状态类型
 * @param store StoreApi 实例，应传入稳定引用
 * @returns Derived<State>
 */
export function useStore<State extends object>(store: StoreApi<State>): Derived<State>;
/**
 * 带选择器读取派生值的重载。
 * @typeParam State store 状态类型
 * @typeParam Selection 选择结果类型
 * @param store StoreApi 实例，应传入稳定引用
 * @param selector 从 State 映射到 Selection 的函数
 * @param equalityFn 判定两次选择结果等价的比较器，缺省为 Object.is
 * @returns Derived<Selection>
 */
export function useStore<State extends object, Selection>(
  store: StoreApi<State>,
  selector: (state: State) => Selection,
  equalityFn?: (previous: Selection, next: Selection) => boolean,
): Derived<Selection>;
/**
 * useStore 的实现签名。
 * @remarks 选择器路径用闭包内 cache 保存上一次 state 与选择结果：state 引用未变时直接复用，
 *          否则重算并按 equalityFn 决定是否复用旧引用，使等价结果保持引用稳定。
 * @see useExternal
 */
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
      // state 引用未变时直接复用旧结果，避免重复执行 selector。
      if (cache && Object.is(cache.state, state)) return cache.selection;
      const next = selector(state);
      // 比较器判等时复用旧引用，避免等价结果引发下游不必要的更新。
      const selection = cache && equalityFn(cache.selection, next) ? cache.selection : next;
      cache = { state, selection };
      return selection;
    },
    (notify) => store.subscribe(notify),
  );
}
