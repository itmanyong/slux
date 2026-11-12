/**
 * @file octane 适配层的 Scope 上下文：经 Provider 组件向下传递 @slux/core 的 Scope，并提供配对的读取 hook。
 */

import { createContext, createElement, useContext } from "octane";
import type { OctaneNode } from "octane";
import type { Scope } from "@slux/core";

/**
 * ScopeProvider 组件的 props 类型。
 */
export type ScopeProviderProps = {
  /** 要向下传递的 Scope 实例。 */
  readonly scope: Scope;
  /** 要渲染的子节点，可选。 */
  readonly children?: OctaneNode;
};
/**
 * 承载 Scope 的上下文对象，默认值 null 表示未提供作用域。
 */
export const ScopeContext = createContext<Scope | null>(null);

/**
 * 把给定 Scope 经 ScopeContext 向下提供的组件。
 * @param props 组件 props：scope 为要传递的 Scope 实例，children 为子节点
 * @returns 承载 value 与 children 的上下文节点
 * @see useScopeContext 配对的读取 hook
 */
export function ScopeProvider({ scope, children }: ScopeProviderProps) {
  return createElement(ScopeContext, { value: scope, children });
}

/**
 * 读取当前上下文中由 ScopeProvider 提供的 Scope，未提供时返回 null。
 * @returns 当前上下文的 Scope；无提供者时为 null
 * @remarks 须在框架约定的 hook 调用时机调用
 * @see ScopeProvider 配对的上下文提供组件
 */
export function useScopeContext(): Scope | null {
  return useContext(ScopeContext);
}
