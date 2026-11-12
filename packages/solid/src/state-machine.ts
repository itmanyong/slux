/**
 * @file 把 @slux/state-machine 的 StateMachine 经 useSignal 包装为 Solid 的
 * Accessor<MachineSnapshot>。
 */

import type { Accessor } from "solid-js";
import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import { useSignal } from "./use-signal.js";

/**
 * 订阅 StateMachine 并返回一个 Solid Accessor；调用该 Accessor 才取得当前快照。
 * 仅做类型化转发，让状态机与各框架适配层共用同一套 signal 读取语义。
 * @typeParam Context 状态机上下文数据类型。
 * @typeParam Event 可派发的事件类型，须带 string 类型的 type 判别字段。
 * @typeParam State 状态名类型，通常为状态名字面量联合。
 * @param machine StateMachine 实例；应传入稳定引用。
 * @returns Accessor<MachineSnapshot<Context, State>> 读取函数，订阅生命周期由 useSignal 管理。
 * @see useSignal
 */
export function useMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
): Accessor<MachineSnapshot<Context, State>> {
  return useSignal(machine);
}
