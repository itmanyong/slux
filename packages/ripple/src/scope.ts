/**
 * @file Ripple 适配层的 Scope context：基于 Ripple 的 Context 在组件树内传递 @slux/core 的 Scope。
 */

import { Context } from "ripple";
import type { Scope } from "@slux/core";

/**
 * 承载当前 Scope 的 Ripple Context，默认值 null 表示「未提供 Scope」。
 * @see provideScope
 * @see useScopeContext
 */
export const ScopeContext = new Context<Scope | null>(null);

/**
 * 把 Scope 写入当前 Ripple 上下文，供同一上下文内的 useScopeContext 读取。
 * @param scope 要提供的 Scope 实例，其销毁由调用方负责
 */
export function provideScope(scope: Scope): void {
  ScopeContext.set(scope);
}

/**
 * 读取最近一次 provideScope 写入的 Scope；未提供时返回 null，由调用方自行决定回退行为。
 * @returns 当前 Scope，未提供时为 null
 */
export function useScopeContext(): Scope | null {
  return ScopeContext.get();
}
