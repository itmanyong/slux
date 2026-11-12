/**
 * @file 把 @slux/flux 的 FluxStore 经 useSignal 包装为 Vue 的 Readonly<Ref<State>>。
 */

import type { Ref } from "vue";
import type { FluxAction, FluxStore } from "@slux/flux";
import { useSignal } from "./use-signal.js";

/**
 * 订阅 FluxStore 并返回一个只读的 Vue Ref；读取其 .value 才取得当前 state。
 * @typeParam State store 持有的状态类型，也是 Ref 的值类型
 * @typeParam Action 可派发的 action 类型，约束为 @slux/flux 的 FluxAction
 * @param store FluxStore 实例，应传入稳定引用
 * @returns 只读 Ref<State>，订阅生命周期由 useSignal 管理
 * @see useSignal
 */
export function useFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Readonly<Ref<State>> {
  return useSignal(store);
}
