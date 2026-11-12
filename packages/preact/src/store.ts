/**
 * @file store hook：useStore 把 @slux/store 的 StoreApi 经 useSyncExternalStore 接入 Preact，提供整状态读取与带选择器的派生读取两种重载。
 */

import { useCallback, useMemo } from "preact/hooks";
import type { StoreApi } from "@slux/store";
import { useSyncExternalStore } from "preact/compat";

/**
 * 读取整个 store 状态的重载：不传 selector 时直接返回 State。
 * @typeParam State store 状态类型，约束为 object
 * @param store StoreApi 实例，应传入稳定引用
 * @returns 当前整状态
 */
export function useStore<State extends object>(store: StoreApi<State>): State;
/**
 * 带选择器读取派生值的重载：selector 从整状态中选取 Selection，equalityFn 判定两次结果是否等价。
 * @typeParam State store 状态类型，约束为 object
 * @typeParam Selection selector 的输出类型
 * @param store StoreApi 实例，应传入稳定引用
 * @param selector 从 State 映射到 Selection 的函数
 * @param equalityFn 比较上一次与本次选择结果的函数；省略时默认取 Object.is
 * @returns 当前选择结果
 */
export function useStore<State extends object, Selection>(
  store: StoreApi<State>,
  selector: (state: State) => Selection,
  equalityFn?: (previous: Selection, next: Selection) => boolean,
): Selection;
/**
 * useStore 的实现签名：合并整状态读取与带选择器读取两条路径。
 * 带 selector 时用 useMemo 内的局部缓存保存「上一次 state 与选择结果」，让 getSnapshot 在状态未变时返回稳定引用，避免同一状态被判定为变化。
 * @typeParam State store 状态类型，约束为 object
 * @typeParam Selection selector 的输出类型；未使用 selector 时该类型不参与返回值
 * @param store StoreApi 实例，应传入稳定引用
 * @param selector 可选的派生函数；为空时走整状态路径
 * @param equalityFn 选择结果的等价比较器，默认 Object.is
 * @returns 整状态（无 selector）或选择结果
 * @remarks 缓存随 [store, selector, equalityFn] 重建，为 useMemo 内局部变量，不跨并发渲染共享；SSR 阶段复用 getSnapshot 作为服务端快照
 */
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
