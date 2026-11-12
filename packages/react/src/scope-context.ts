/**
 * @file 把 @slux/core 的 Scope 沿 React 组件树下发的 context：定义 ScopeContext、
 * ScopeProvider 与 useScopeContext。以 .ts 实现，故用 createElement 构造 Provider。
 */

import { createContext, createElement, useContext } from "react";
import type { Scope } from "@slux/core";
import type { ScopeProviderProps } from "./types.js";

/**
 * 承载当前 Scope 的 React context；默认值 null 作为「未包裹 ScopeProvider」的哨兵，
 * 使读取方可以显式区分「无 scope」与「有 scope」两种状态。
 * @see ScopeProvider
 * @see useScopeContext
 */
export const ScopeContext = createContext<Scope | null>(null);

/**
 * 把传入的 Scope 注入 context，供子树内的 useScopeContext 读取。
 * 本文件为 .ts（非 .tsx），用 createElement 显式构造 Provider 而非 JSX。
 * @param scope 要下发的 Scope 实例，生命周期由调用方持有。
 * @param children 要渲染的子树。
 * @returns Provider 元素。
 * @see ScopeContext
 * @see useScopeContext
 */
export function ScopeProvider({ scope, children }: ScopeProviderProps) {
  return createElement(ScopeContext.Provider, { value: scope }, children);
}

/**
 * 读取最近一层 ScopeProvider 注入的 Scope；未包裹 Provider 时返回 null。
 * 不抛错，让调用方自行决定缺失 scope 时的回退行为。
 * @returns 当前 Scope，未包裹 Provider 时为 null。
 * @remarks 必须在对应 Provider 的子树内调用才能取得非 null 值。
 * @see ScopeContext
 * @see ScopeProvider
 */
export function useScopeContext(): Scope | null {
  return useContext(ScopeContext);
}
