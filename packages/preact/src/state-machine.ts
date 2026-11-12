/**
 * @file 状态机 hook：useMachine 把 @slux/state-machine 的 StateMachine 经 useSignal 读取为组件可用的 MachineSnapshot。
 */

import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import { useSignal } from "./index.js";

/**
 * 订阅 StateMachine 并返回其当前 MachineSnapshot，状态变化经 useSignal 触发重渲染。
 * 仅做类型化转发，让状态机与各框架适配层共用同一套 signal 读取语义。
 * @typeParam Context 状态机上下文数据类型
 * @typeParam Event 可派发的事件类型，约束为必须带 string 类型的 type 判别字段
 * @typeParam State 状态名类型，约束为 string 的子类型（通常为状态名字面量联合）
 * @param machine StateMachine 实例，应传入稳定引用
 * @returns 当前快照
 * @see useSignal
 * @see useFluxStore
 */
export function useMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
): MachineSnapshot<Context, State> {
  return useSignal(machine);
}
