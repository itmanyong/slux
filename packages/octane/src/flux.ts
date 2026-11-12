/**
 * @file octane 适配层的 Flux store hook：把 FluxStore 的状态经 useSignal 暴露给组件。
 */

import type { FluxStore } from "@slux/flux";
import { useSignal } from "./index.js";

/**
 * 读取 FluxStore 的当前状态，委托给 useSignal 并透传可选的 slot。
 * @typeParam State store 持有的状态类型
 * @typeParam Action store 接受的动作类型，约束为含 type: string 的对象
 * @param store 待读取的 FluxStore 实例
 * @param slot 可选的 symbol 槽标识，原样转发给 useSignal
 * @returns 当前状态 State
 * @remarks 订阅的建立与清理由 useSignal 管理，调用方无需手动退订
 * @see useSignal 实际执行订阅与清理的入口
 */
export function useFluxStore<State, Action extends { type: string }>(store: FluxStore<State, Action>, slot?: symbol): State {
  return useSignal(store, slot);
}
