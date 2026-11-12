/**
 * @file store 组件：StoreValue 把 StoreApi 的状态（或经 selector 投影的值）以 render prop 形式渲染。
 */

import type { InfernoNode } from "inferno";
import type { StoreApi } from "@slux/store";
import { Observer } from "./observer.js";

/**
 * StoreValue 组件的 props 类型，以交叉类型把「基础 props」与「selector 约束」组合起来。
 * selector 的联合约束保证：想读出与 State 不同的 Selection 时必须提供投影函数，
 * 否则对应分支为 never，避免运行时读到类型不符的值。
 * @typeParam State store 的状态类型，约束为 object
 * @typeParam Selection 组件读出的值类型，默认与 State 一致；提供 selector 时为其返回类型
 */
export type StoreValueProps<State extends object, Selection = State> = {
  /** 数据源 StoreApi 实例，也是判断数据源是否变化的标识。 */
  store: StoreApi<State>;
  /** 可选的相等比较函数；缺失时组件默认用 Object.is。 */
  equalityFn?: (previous: Selection, next: Selection) => boolean;
  /** 渲染函数：接收当前值，返回要渲染的节点。 */
  children: (value: Selection) => InfernoNode;
} & ({ selector: (state: State) => Selection } | (State extends Selection ? { selector?: undefined } : never));
/**
 * 把 StoreApi<State> 的状态渲染为 InfernoNode 的组件，支持经 selector 投影为 Selection 并自定义相等比较。
 * @typeParam State store 的状态类型，约束为 object
 * @typeParam Selection 组件读出的值类型，默认与 State 一致
 * @see Observer 编排渲染与订阅生命周期的基类
 */
export class StoreValue<State extends object, Selection = State> extends Observer<StoreValueProps<State, Selection>, Selection> {
  /**
   * 向基类提供数据源标识：返回 props 中的 store。
   */
  protected override source(props: StoreValueProps<State, Selection>) {
    return props.store;
  }
  /**
   * 读取当前值：有 selector 时对状态做投影，否则返回整个状态。
   * @remarks 无 selector 分支依赖类型层面已保证 State 与 Selection 兼容，故用双重断言
   */
  protected override read(): Selection {
    const { store, selector } = this.props;
    return selector ? selector(store.getState()) : (store.getState() as unknown as Selection);
  }
  /**
   * 判断新旧值是否相等：优先用 props.equalityFn，否则回退到 Object.is。
   * @param previous 上一次读取的值
   * @param next 本次读取的值
   * @returns true 表示视为相等、无需重渲染
   */
  protected override equal(previous: Selection, next: Selection): boolean {
    return (this.props.equalityFn ?? Object.is)(previous, next);
  }
  /**
   * 渲染当前值：以 children 作为 render prop 调用。
   */
  protected override view(value: Selection): InfernoNode {
    return (this.props.children as (value: Selection) => InfernoNode)(value);
  }
  /**
   * 建立订阅：把基类的通知回调交给 store.subscribe，并返回其清理函数。
   * @param notify 值变化时应调用的通知回调
   * @returns store 订阅的清理函数，由基类在卸载或数据源变化时调用
   */
  protected override subscribe(notify: () => void): () => void {
    return this.props.store.subscribe(notify);
  }
}
