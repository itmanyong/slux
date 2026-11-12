/**
 * @file 观察者基类：把可订阅数据源的当前值渲染为 InfernoNode，并在组件生命周期内管理订阅的建立、重连与清理。
 */

import { Component } from "inferno";
import type { InfernoNode } from "inferno";

/**
 * 把可订阅数据源的当前值渲染为 InfernoNode 的抽象组件基类。
 * 以模板方法模式把读值、订阅、数据源标识、渲染四个环节留给子类覆写，基类只负责维护订阅、
 * 在值变化时触发重渲染，以及在数据源变化时重新连接订阅。
 * @typeParam Props 组件 props 类型
 * @typeParam Value 数据源当前值的类型
 * @remarks 子类 subscribe 必须返回释放订阅的清理函数，否则卸载时无法清理
 */
export abstract class Observer<Props, Value> extends Component<Props> {
  /** 当前订阅的清理函数；undefined 表示尚未连接或已释放。 */
  #unsubscribe: (() => void) | undefined;
  /** 最近一次读取的值；首次 render 才赋值，故声明处用非空断言。 */
  #value!: Value;
  /**
   * 读取数据源当前值，由子类实现。
   */
  protected abstract read(): Value;
  /**
   * 建立数据源订阅，由子类实现。
   * @param notify 值变化时应调用的通知回调
   * @returns 释放订阅的清理函数，在重连或卸载时调用
   */
  protected abstract subscribe(notify: () => void): () => void;
  /**
   * 从 props 提取用于判断数据源是否变化的标识，由子类实现；基类仅做引用比较。
   */
  protected abstract source(props: Props): unknown;
  /**
   * 把当前值渲染为节点，由子类实现。
   */
  protected abstract view(value: Value): InfernoNode;
  /**
   * 判断新旧值是否相等，默认用 Object.is 比较；子类可覆写以自定义相等策略。
   * @param previous 上一次读取的值
   * @param next 本次读取的值
   * @returns true 表示视为相等、无需重渲染
   */
  protected equal(previous: Value, next: Value): boolean {
    return Object.is(previous, next);
  }
  /**
   * 订阅通知回调：重新读取数据源，仅在值相对上一次变化时更新并触发重渲染。
   */
  #check = () => {
    const next = this.read();
    if (!this.equal(this.#value, next)) {
      this.#value = next;
      this.forceUpdate();
    }
  };
  /**
   * 建立（或重建）订阅并保存清理函数；随后立即检查一次，以同步订阅建立期间可能发生的变化。
   */
  #connect() {
    this.#unsubscribe = this.subscribe(this.#check);
    this.#check();
  }
  /**
   * 组件挂载钩子：建立订阅并同步首值。
   */
  override componentDidMount() {
    this.#connect();
  }
  /**
   * 组件更新钩子：仅当数据源标识变化时，先释放旧订阅再重新连接。
   * @param previous 更新前的 props
   */
  override componentDidUpdate(previous: Props) {
    if (this.source(previous) !== this.source(this.props)) {
      this.#unsubscribe?.();
      this.#connect();
    }
  }
  /**
   * 组件卸载钩子：释放当前订阅，避免卸载后仍收到通知。
   */
  override componentWillUnmount() {
    this.#unsubscribe?.();
  }
  /**
   * 渲染：同步读取当前值并交给 view 生成节点；这也是 #value 的实际初始化点。
   */
  override render(): InfernoNode {
    this.#value = this.read();
    return this.view(this.#value);
  }
}
