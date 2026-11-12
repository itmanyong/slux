/**
 * @file 把 @slux/core 的 Scope 沿 Solid 组件树下发的 context：定义 ScopeProviderProps、
 * ScopeContext、ScopeProvider 与 useScope。以 .ts 实现，直接调用 Provider 函数。
 */

import { createContext, useContext } from "solid-js";
import type { JSX } from "solid-js";
import type { Scope } from "@slux/core";

/**
 * ScopeProvider 的属性类型：把一个 Scope 实例通过 context 下发给子树。
 * @see ScopeProvider
 */
export type ScopeProviderProps = {
  /** 要下发的 Scope 实例，生命周期由调用方持有。 */
  readonly scope: Scope;
  /** provider 包裹的子树。 */
  readonly children: JSX.Element;
};
/**
 * 承载当前 Scope 的 Solid context；createContext 未传默认值，
 * 未包裹 ScopeProvider 时 useContext 返回 undefined，由 useScope 作为「无 scope」哨兵。
 * @see ScopeProvider
 * @see useScope
 */
export const ScopeContext = createContext<Scope>();
/**
 * 把传入的 Scope 注入 context，供子树内的 useScope 读取。
 * 以函数调用形式构造 Provider（本文件为 .ts，且 Solid 的 Provider 可直接传 props 调用）。
 * @param props 属性对象：scope 为要下发的 Scope 实例，children 为要渲染的子树。
 * @returns Provider 产生的 JSX.Element。
 * @see ScopeContext
 * @see useScope
 */
export function ScopeProvider(props: ScopeProviderProps): JSX.Element {
  return ScopeContext.Provider({
    value: props.scope,
    // children 以 getter 提供，延迟到属性被访问时才求值。
    get children() {
      return props.children;
    },
  });
}
/**
 * 读取最近一层 ScopeProvider 注入的 Scope；未包裹 Provider 时返回 undefined。
 * 不抛错，让调用方自行决定缺失 scope 时的回退行为。
 * @returns 当前 Scope，未包裹 Provider 时为 undefined。
 * @remarks 必须在对应 Provider 子树内调用才能取得非 undefined 值。
 * @see ScopeContext
 * @see ScopeProvider
 */
export function useScope(): Scope | undefined {
  return useContext(ScopeContext);
}
