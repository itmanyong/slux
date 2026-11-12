/**
 * @file Ripple 适配层的 Flux store hook：把 @slux/flux 的 FluxStore 包装为 Derived<State>。
 */

import { useExternal } from "./external.js";
import type { FluxAction, FluxStore } from "@slux/flux";
import type { Derived } from "ripple";

/**
 * 把 FluxStore 转换为 Ripple 的 Derived；状态变化经 useExternal 触发派生值更新。
 * @typeParam State store 持有的状态类型
 * @typeParam Action 可派发的 action 类型
 * @param store FluxStore 实例，应传入稳定引用
 * @returns Derived<State>
 * @see useExternal
 */
export function useFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Derived<State> {
  return useExternal(
    () => store.get(),
    (notify) => store.subscribe(notify),
  );
}
