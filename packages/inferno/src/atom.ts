/**
 * @file 原子组件：AtomValue 以 render prop 形式渲染原子的值，并提供写入原子的辅助函数 setAtom。
 */

import type { InfernoNode } from "inferno";
import type { Atom, AnyReadableAtom } from "@slux/atom";
import { effect } from "@slux/core";
import { Observer } from "./observer.js";

/**
 * AtomValue 组件的 props 类型。
 * @typeParam T 原子持有的值类型
 */
export type AtomValueProps<T> = {
  /** 被读取的可读原子句柄。 */
  atom: AnyReadableAtom<T>;
  /** 渲染函数：接收当前值，返回要渲染的节点。 */
  children: (value: T) => InfernoNode;
};
/**
 * 把原子的值渲染为 InfernoNode 的组件，以 children 作为 render prop 接收当前值。
 * 通过覆写 Observer 的四个钩子把原子相关实现委托给基类编排。
 * @typeParam T 原子持有的值类型
 * @see Observer 编排渲染与订阅生命周期的基类
 */
export class AtomValue<T> extends Observer<AtomValueProps<T>, T> {
  /**
   * 向基类提供数据源：返回 props 中的原子句柄。
   */
  protected override source(props: AtomValueProps<T>) {
    return props.atom;
  }
  /**
   * 读取当前值：调用原子的 get()。
   */
  protected override read(): T {
    return this.props.atom.get();
  }
  /**
   * 渲染当前值：以 children 作为 render prop 把值映射为节点。
   */
  protected override view(value: T): InfernoNode {
    return this.props.children(value);
  }
  /**
   * 建立订阅：订阅原子变化并注册 effect 主动求值，返回释放两者的清理函数。
   * @param notify 值变化时应调用的通知回调
   * @returns 清理函数：先取消原子订阅、再停止 effect
   */
  protected override subscribe(notify: () => void): () => void {
    const atom = this.props.atom;
    const unsubscribe = atom.subscribe(notify);
    const dispose = effect(() => {
      atom.get();
    });
    return () => {
      unsubscribe();
      dispose();
    };
  }
}
/**
 * 向可写原子写入替换值，供事件回调等场景直接改写。
 * @typeParam T 原子持有的值类型
 * @param atom 目标可写原子句柄
 * @param value 待写入的替换值
 */
export function setAtom<T>(atom: Atom<T>, value: T): void {
  atom.set(value);
}
