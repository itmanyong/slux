/**
 * @file octane 适配层的 store hook：把 StoreApi 的状态（或经 selector 的投影值）接入 useSyncExternalStore，支持自定义相等比较与槽标识。
 */

import { useCallback, useMemo, useSyncExternalStore } from "octane";
import type { StoreApi } from "@slux/store";
import { subSlot } from "./slots.js";

/**
 * 无 selector 重载：读取 store 的完整状态并返回。
 * @typeParam State store 的状态类型，约束为 object
 * @param store 待读取的 StoreApi 实例
 * @param slot 可选的 symbol 槽标识
 * @returns 当前完整状态 State
 * @see useStore 带 selector 的重载
 */
export function useStore<State extends object>(store: StoreApi<State>, slot?: symbol): State;
/**
 * 带 selector 重载：把 store 状态投影为 Selection 后返回，可自定义相等比较。
 * @typeParam State store 的状态类型，约束为 object
 * @typeParam Selection selector 返回值类型
 * @param store 待读取的 StoreApi 实例
 * @param selector 投影函数，接收完整状态并返回 Selection
 * @param equalityFn 可选的相等比较函数，缺失时回退到 Object.is
 * @param slot 可选的 symbol 槽标识（第四参数）
 * @returns 当前投影值 Selection
 * @see useStore 无 selector 的重载
 */
export function useStore<State extends object, Selection>(
  store: StoreApi<State>,
  selector: (state: State) => Selection,
  equalityFn?: (previous: Selection, next: Selection) => boolean,
  slot?: symbol,
): Selection;
/**
 * 上述重载的实现：按参数类型解析 slot/selector/equalityFn，使两种重载共用一份实现。
 * 有 selector 时读取函数带缓存，保持投影值引用稳定、避免无谓重渲染。
 * @typeParam State store 的状态类型，约束为 object
 * @typeParam Selection selector 返回值类型
 * @param store 待读取的 StoreApi 实例
 * @param selectorOrSlot 函数时为 selector，symbol 时为 slot
 * @param equalityOrSlot 函数时为 equalityFn，symbol 时为 slot
 * @param explicitSlot 带 selector 重载中显式传入的 slot
 * @returns 无 selector 时为 State，有 selector 时为 Selection
 */
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
      // 缓存上一次的 state 与 selection：state 未变或投影值相等时复用旧引用，避免无谓重渲染。
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
