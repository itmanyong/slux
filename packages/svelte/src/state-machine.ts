/**
 * @file Svelte 适配层的状态机转换函数：把 @slux/state-machine 的 StateMachine 经 toReadable
 * 包装为 Svelte 的 Readable<MachineSnapshot>。
 */

import type { Readable } from "svelte/store";
import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import { toReadable } from "./signal.js";

/**
 * 把 StateMachine 转换为 Svelte 的 Readable store，快照变化经 toReadable 触发订阅者更新。
 * @typeParam Context 状态机上下文数据类型
 * @typeParam Event 可派发的事件类型，约束为必须带 string 类型的 type 判别字段
 * @typeParam State 状态名类型，约束为 string 的子类型
 * @param machine StateMachine 实例，应传入稳定引用
 * @returns Readable<MachineSnapshot<Context, State>>
 * @remarks 仅做类型化转发，订阅的建立与清理、SSR 边界均由 toReadable 承担
 * @see toReadable
 */
export function toMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
): Readable<MachineSnapshot<Context, State>> {
  return toReadable(machine);
}
