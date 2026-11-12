/**
 * @file 把 @slux/state-machine 的 StateMachine 经 useSignal 包装为 Vue 的 Readonly<Ref<MachineSnapshot>>。
 */

import type { Ref } from "vue";
import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import { useSignal } from "./use-signal.js";

/**
 * 订阅 StateMachine 并返回一个只读的 Vue Ref；读取其 .value 才取得当前快照。
 * @typeParam Context 状态机上下文数据类型
 * @typeParam Event 可派发的事件类型，约束为必须带 string 类型的 type 判别字段
 * @typeParam State 状态名类型，约束为 string 的子类型
 * @param machine StateMachine 实例，应传入稳定引用
 * @returns 只读 Ref<MachineSnapshot<Context, State>>，订阅生命周期由 useSignal 管理
 * @see useSignal
 */
export function useMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
): Readonly<Ref<MachineSnapshot<Context, State>>> {
  return useSignal(machine);
}
