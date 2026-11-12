/**
 * @file octane 适配层的状态机 hook：把状态机的当前快照经 useSignal 暴露给组件。
 */

import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import { useSignal } from "./index.js";

/**
 * 读取状态机的当前快照，委托给 useSignal 并透传可选的 slot；不派发事件或推进状态。
 * @typeParam Context 状态机上下文类型
 * @typeParam Event 事件类型，约束为含 type: string 的对象
 * @typeParam State 状态名称类型，约束为 string
 * @param machine 待读取的 StateMachine 实例
 * @param slot 可选的 symbol 槽标识，原样转发给 useSignal
 * @returns 当前快照 MachineSnapshot<Context, State>
 * @remarks 订阅的建立与清理由 useSignal 管理，调用方无需手动退订
 * @see useSignal 实际执行订阅与清理的入口
 * @see useFluxStore 配对的 Flux store 读取入口
 */
export function useMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
  slot?: symbol,
): MachineSnapshot<Context, State> {
  return useSignal(machine, slot);
}
