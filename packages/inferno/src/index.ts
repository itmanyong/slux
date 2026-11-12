/**
 * @file 公共入口：提供 Scope 上下文传递组件（ScopeProvider/getScope）、通用 SignalValue 组件，并汇总自动导入 API。
 */

import { Component } from "inferno";
import type { InfernoNode } from "inferno";
import { effect } from "@slux/core";
import type { Scope, Subscribable } from "@slux/core";
import { Observer } from "./observer.js";

/**
 * inferno 组件 child context 的形状，用于向下传递 @slux/core 的 Scope；sluxScope 缺失表示子树未提供作用域。
 */
export type ScopeContext = { sluxScope?: Scope };
/**
 * ScopeProvider 组件的 props 类型：scope 为要向下传递的 Scope 实例。
 */
export type ScopeProviderProps = { scope: Scope; children?: InfernoNode };
/**
 * 通过 child context 向下传递 Scope 的组件，使子树中的 SignalValue 能经 getScope 取得该作用域。
 */
export class ScopeProvider extends Component<ScopeProviderProps> {
  /**
   * 生成子上下文：把 props.scope 作为 sluxScope 提供。
   */
  override getChildContext(): ScopeContext {
    return { sluxScope: this.props.scope };
  }
  /**
   * 渲染：原样返回 props.children，不额外包裹节点。
   */
  override render(): InfernoNode {
    return this.props.children;
  }
}
/**
 * 从组件上下文读取可用的 Scope。
 * @param context 组件上下文，含可选的 sluxScope 字段
 * @returns 注入的 Scope，未提供时为 undefined
 * @see ScopeProvider 提供该上下文的组件
 */
export function getScope(context: ScopeContext): Scope | undefined {
  return context.sluxScope;
}
/**
 * SignalValue 组件的 props 类型。
 * @typeParam T 数据源持有的值类型
 */
export type SignalValueProps<T> = {
  /** 数据源 Subscribable<T>。 */
  source: Subscribable<T>;
  /** 渲染函数：接收当前值，返回要渲染的节点。 */
  children: (value: T) => InfernoNode;
};
/**
 * 把 Subscribable<T> 的当前值渲染为 InfernoNode 的组件，也是 FluxValue 等具体组件的基类。
 * 挂载前若有 Scope 则经 Scope 读取，挂载后直接读 source；订阅与 effect 由本类建立并清理。
 * @typeParam T 数据源持有的值类型
 * @typeParam Props 组件 props 类型，约束为 SignalValueProps<T>；子类可传入更具体的 props 类型
 * @remarks componentDidMount 中置位 #mounted 必须先于 super.componentDidMount()，使父类触发的读取落在挂载后路径
 * @see Observer 编排渲染与订阅生命周期的基类
 * @see ScopeProvider 提供 sluxScope 上下文的组件
 */
export class SignalValue<T, Props extends SignalValueProps<T> = SignalValueProps<T>> extends Observer<Props, T> {
  /** 组件是否已挂载，用于区分挂载前后的读取路径。 */
  #mounted = false;
  /**
   * 组件挂载钩子：先标记已挂载，再调用父类钩子建立订阅。
   */
  override componentDidMount() {
    this.#mounted = true;
    super.componentDidMount();
  }
  /**
   * 向基类提供数据源标识：返回 props 中的 source。
   */
  protected override source(props: Props) {
    return props.source;
  }
  /**
   * 读取当前值：未挂载且存在 Scope 时经 Scope 读取，其余情况直接读取 source。
   */
  protected override read(): T {
    const scope = getScope(this.context as ScopeContext);
    return !this.#mounted && scope ? scope.get(this.props.source) : this.props.source.get();
  }
  /**
   * 渲染当前值：以 children 作为 render prop 调用。
   */
  protected override view(value: T): InfernoNode {
    return (this.props.children as (value: T) => InfernoNode)(value);
  }
  /**
   * 建立订阅：订阅 source 变化并注册 effect 主动求值，返回释放两者的清理函数。
   * @param notify 值变化时应调用的通知回调
   * @returns 清理函数：先取消 source 订阅、再停止 effect
   */
  protected override subscribe(notify: () => void): () => void {
    const source = this.props.source;
    const unsubscribe = source.subscribe(notify);
    const dispose = effect(() => {
      source.get();
    });
    return () => {
      unsubscribe();
      dispose();
    };
  }
}
export { createAutoImportApis } from "./auto-import-api.js";
