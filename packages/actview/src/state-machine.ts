/**
 * @file 把 @slux/state-machine 的 StateMachine 桥接为 actview 侧的只读快照 Ref：快照读取与变更订阅委托给 useSignal，转移逻辑由 @slux/state-machine 承担。
 */
import { useSignal } from "./use-signal.js";
import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import type { Ref } from "@actview/core";

/**
 * 把状态机当前快照暴露为 actview 的只读 Ref，状态转移后经订阅刷新；本 hook 不派发事件，读取与驱动转移解耦。
 * @typeParam Context 状态机上下文数据类型
 * @typeParam Event 事件类型，须带字符串 type 字段作为事件判别依据
 * @typeParam State 状态名类型，取值为字符串联合
 * @param machine StateMachine 实例
 * @returns 只读 Ref，读取其当前值得到 MachineSnapshot<Context, State> 快照，随作用域释放失效
 * @remarks 事件派发与转移归约由状态机自身负责，转移后的快照刷新经 useSignal 订阅链路到达 Ref。
 * @see useSignal 订阅与刷新链路的实现处；@slux/state-machine 的 StateMachine、MachineSnapshot
 */
export function useMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
): Readonly<Ref<MachineSnapshot<Context, State>>> {
  return useSignal(machine);
}
