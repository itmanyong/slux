/**
 * @file Observable 组件：ObservableValue 把 ObservableState 的值以 render prop 形式渲染。
 */

import type { ObservableState } from "@slux/rxjs";
import type { InfernoNode } from "inferno";
import { SignalValue } from "./index.js";

/**
 * ObservableValue 组件的 props 类型。
 * @typeParam T ObservableState 发射的值类型
 */
export type ObservableValueProps<T> = {
  /** 数据源 ObservableState 实例。 */
  source: ObservableState<T>;
  /** 渲染函数：接收当前值，返回要渲染的节点。 */
  children: (value: T) => InfernoNode;
};

/**
 * 把 ObservableState<T> 的当前值渲染为 InfernoNode 的组件，以 children 作为 render prop 接收当前值。
 * 以空子类方式继承 SignalValue，仅固定基类的值与 props 泛型，复用其订阅与渲染逻辑。
 * @typeParam T ObservableState 发射的值类型
 * @see SignalValue 提供订阅与渲染逻辑的基类
 */
export class ObservableValue<T> extends SignalValue<T, ObservableValueProps<T>> {}
