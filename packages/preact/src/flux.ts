/**
 * @file Flux store hook：useFluxStore 把 @slux/flux 的 FluxStore 经 useSignal 读取为组件状态。
 */

import type { FluxStore } from "@slux/flux";
import { useSignal } from "./index.js";

/**
 * 订阅 FluxStore 并返回当前 state，状态变化经 useSignal 触发重渲染。
 * 仅做类型化转发，让 Flux 与各框架适配层共用同一套 signal 读取语义。
 * @typeParam State store 持有的状态类型
 * @typeParam Action 可派发的 action 类型，约束为必须带 string 类型的 type 判别字段
 * @param store FluxStore 实例，应传入稳定引用
 * @returns 当前状态
 * @see useSignal
 */
export function useFluxStore<State, Action extends { type: string }>(store: FluxStore<State, Action>): State {
  return useSignal(store);
}
