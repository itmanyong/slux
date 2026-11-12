/**
 * @file Svelte 适配层的 Flux store 转换函数：把 @slux/flux 的 FluxStore 经 toReadable
 * 包装为 Svelte 的 Readable store。
 */

import type { Readable } from "svelte/store";
import type { FluxAction, FluxStore } from "@slux/flux";
import { toReadable } from "./signal.js";

/**
 * 把 FluxStore 转换为 Svelte 的 Readable store，状态变化经 toReadable 触发订阅者更新。
 * @typeParam State store 持有的状态类型
 * @typeParam Action 可派发的 action 类型，约束为 @slux/flux 的 FluxAction
 * @param store FluxStore 实例，应传入稳定引用
 * @returns Readable<State>
 * @remarks 仅做类型化转发，订阅的建立与清理、SSR 边界均由 toReadable 承担
 * @see toReadable
 */
export function toFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Readable<State> {
  return toReadable(store);
}
