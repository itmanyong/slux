/**
 * @file Flux store 组件：FluxValue 把 FluxStore 的状态以 render prop 形式渲染。
 */

import type { FluxStore } from "@slux/flux";
import type { InfernoNode } from "inferno";
import { SignalValue } from "./index.js";

/**
 * FluxValue 组件的 props 类型。
 * @typeParam State FluxStore 持有的状态类型
 * @typeParam Action store 接受的动作类型，约束为含 type: string 的对象
 */
export type FluxValueProps<State, Action extends { type: string }> = {
  /** 数据源 FluxStore 实例。 */
  source: FluxStore<State, Action>;
  /** 渲染函数：接收当前状态，返回要渲染的节点。 */
  children: (value: State) => InfernoNode;
};

/**
 * 把 FluxStore 的状态渲染为 InfernoNode 的组件，以 children 作为 render prop 接收当前状态。
 * 以空子类方式继承 SignalValue，仅固定基类的值与 props 泛型，复用其订阅与渲染逻辑。
 * @typeParam State FluxStore 持有的状态类型
 * @typeParam Action store 接受的动作类型，约束为含 type: string 的对象
 * @see SignalValue 提供订阅与渲染逻辑的基类
 */
export class FluxValue<State, Action extends { type: string }> extends SignalValue<State, FluxValueProps<State, Action>> {}
