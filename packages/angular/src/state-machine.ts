/**
 * @file 把 @slux/state-machine 的 StateMachine 注入为 Angular 的 Signal。
 */

import type { Signal } from "@angular/core";
import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import { toAngularSignal } from "./bridge.js";
import type { ToAngularSignalOptions } from "./bridge.js";

/**
 * 把状态机的当前快照转换为 Angular 的 Signal<MachineSnapshot<Context, State>>。
 * @typeParam Context 状态机上下文类型
 * @typeParam Event 事件类型，约束为含 type: string 的对象
 * @typeParam State 状态名称类型，约束为 string
 * @param machine 待转换的 StateMachine 实例
 * @param options 可选的转换配置；为 undefined 时由 toAngularSignal 采用其默认行为
 * @returns 只读 Signal<MachineSnapshot<Context, State>>，订阅的建立与清理由 toAngularSignal 管理
 * @see toAngularSignal 实际执行转换与订阅清理的实现
 * @see injectFluxStore 配对的 Flux store 读取信号入口
 */
export function injectMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
  options?: ToAngularSignalOptions<MachineSnapshot<Context, State>>,
): Signal<MachineSnapshot<Context, State>> {
  return toAngularSignal(machine, options);
}
