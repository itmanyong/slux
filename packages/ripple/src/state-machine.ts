/**
 * @file Ripple 适配层的状态机 hook：把 @slux/state-machine 的 StateMachine 包装为
 * Derived<MachineSnapshot>。
 */

import { useExternal } from "./external.js";
import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import type { Derived } from "ripple";

/**
 * 把 StateMachine 转换为 Ripple 的 Derived；快照变化经 useExternal 触发派生值更新。
 * @typeParam Context 状态机上下文数据类型
 * @typeParam Event 可派发的事件类型，须带 string 类型的 type 判别字段
 * @typeParam State 状态名类型（通常为字面量联合）
 * @param machine StateMachine 实例，应传入稳定引用
 * @returns Derived<MachineSnapshot<Context, State>>
 * @see useExternal
 */
export function useMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
): Derived<MachineSnapshot<Context, State>> {
  return useExternal(
    () => machine.get(),
    (notify) => machine.subscribe(notify),
  );
}
