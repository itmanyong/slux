/**
 * @file proxy 组件：ProxyValue 把 proxy 源的快照以 render prop 形式渲染。
 */

import type { InfernoNode } from "inferno";
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { Observer } from "./observer.js";

/**
 * ProxyValue 组件的 props 类型。
 * @typeParam T proxy 源对象类型，约束为 object
 */
export type ProxyValueProps<T extends object> = {
  /** 数据源 proxy 对象，也是判断数据源是否变化的标识。 */
  proxy: T;
  /** 渲染函数：接收当前快照，返回要渲染的节点。 */
  children: (value: Snapshot<T>) => InfernoNode;
};
/**
 * 把 proxy 源的快照渲染为 InfernoNode 的组件，以 children 作为 render prop 接收快照。
 * 通过覆写 Observer 的钩子接入：read 取 snapshot、subscribe 直接复用 @slux/proxy 的订阅。
 * @typeParam T proxy 源对象类型，约束为 object
 * @see Observer 编排渲染与订阅生命周期的基类
 */
export class ProxyValue<T extends object> extends Observer<ProxyValueProps<T>, Snapshot<T>> {
  /**
   * 向基类提供数据源标识：返回 props 中的 proxy 对象。
   */
  protected override source(props: ProxyValueProps<T>) {
    return props.proxy;
  }
  /**
   * 读取当前值：对 proxy 源取一份新快照，不缓存。
   */
  protected override read(): Snapshot<T> {
    return snapshot(this.props.proxy);
  }
  /**
   * 渲染当前值：以 children 作为 render prop 把快照映射为节点。
   */
  protected override view(value: Snapshot<T>): InfernoNode {
    return this.props.children(value);
  }
  /**
   * 建立订阅：把基类的通知回调交给 @slux/proxy 的 subscribe，并返回其清理函数。
   * @param notify 值变化时应调用的通知回调
   * @returns proxy 订阅的清理函数，由基类在卸载或数据源变化时调用
   */
  protected override subscribe(notify: () => void): () => void {
    return subscribe(this.props.proxy, notify);
  }
}
