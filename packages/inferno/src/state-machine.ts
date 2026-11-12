/**
 * @file 状态机组件：MachineValue 把状态机快照以 render prop 形式渲染。
 */

import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import type { InfernoNode } from "inferno";
import { SignalValue } from "./index.js";

/**
 * MachineValue 组件的 props 类型。
 * @typeParam Context 状态机上下文类型
 * @typeParam Event 事件类型，约束为含 type: string 的对象
 * @typeParam State 状态名称类型，约束为 string
 */
export type MachineValueProps<Context, Event extends { type: string }, State extends string> = {
  /** 数据源 StateMachine 实例。 */
  source: StateMachine<Context, Event, State>;
  /** 渲染函数：接收当前快照，返回要渲染的节点。 */
  children: (value: MachineSnapshot<Context, State>) => InfernoNode;
};

/**
 * 把状态机当前快照渲染为 InfernoNode 的组件，以 children 作为 render prop 接收快照。
 * 以空子类方式继承 SignalValue，仅固定基类的值与 props 泛型，复用其订阅与渲染逻辑。
 * @typeParam Context 状态机上下文类型
 * @typeParam Event 事件类型，约束为含 type: string 的对象
 * @typeParam State 状态名称类型，约束为 string
 * @see SignalValue 提供订阅与渲染逻辑的基类
 */
export class MachineValue<Context, Event extends { type: string }, State extends string> extends SignalValue<
  MachineSnapshot<Context, State>,
  MachineValueProps<Context, Event, State>
> {}
