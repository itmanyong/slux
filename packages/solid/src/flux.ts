/**
 * @file 把 @slux/flux 的 FluxStore 经 useSignal 包装为 Solid 的 Accessor<State>。
 */

import type { Accessor } from "solid-js";
import type { FluxAction, FluxStore } from "@slux/flux";
import { useSignal } from "./use-signal.js";

/**
 * 订阅 FluxStore 并返回一个 Solid Accessor；调用该 Accessor 才取得当前 state。
 * 仅做类型化转发，让 Flux 与各框架适配层共用同一套 signal 读取语义。
 * @typeParam State store 持有的状态类型。
 * @typeParam Action 可派发的 action 类型，约束为 @slux/flux 的 FluxAction。
 * @param store FluxStore 实例；应传入稳定引用。
 * @returns Accessor<State> 读取函数，订阅生命周期由 useSignal 管理。
 * @see useSignal
 */
export function useFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Accessor<State> {
  return useSignal(store);
}
