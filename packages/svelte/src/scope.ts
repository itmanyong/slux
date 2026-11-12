/**
 * @file Svelte 适配层的 Scope context：定义 SCOPE_KEY 及 setScope / getScope，
 * 借 Svelte 的 setContext / getContext 在组件树内传递 @slux/core 的 Scope。
 */

import { getContext, setContext } from "svelte";
import type { Scope } from "@slux/core";

/**
 * 用于在 Svelte context 中存取 Scope 的唯一键。
 * 采用 unique symbol 而非字符串，使该键在类型层面唯一且不会与其他 context 键冲突。
 * @remarks 与 setScope / getScope 配对使用
 * @see setScope
 * @see getScope
 */
export const SCOPE_KEY: unique symbol = Symbol("slux-scope");
/**
 * 把 Scope 写入当前组件的 Svelte context，供同一子树内的 getScope 读取。
 * @param scope 要下发的 Scope 实例
 * @remarks 须在组件初始化期间调用（Svelte setContext 的约束），写入仅对当前组件子树可见
 * @see SCOPE_KEY
 * @see getScope
 */
export function setScope(scope: Scope): void {
  setContext(SCOPE_KEY, scope);
}
/**
 * 读取最近一次 setScope 写入的 Scope；未写入时返回 undefined。
 * 不抛错而返回 undefined，让调用方自行决定缺失 scope 时的回退行为。
 * @returns 当前 Scope，或未调用过 setScope 时为 undefined
 * @remarks 须在组件初始化期间读取，且只能读到祖先组件写入的值
 * @see SCOPE_KEY
 * @see setScope
 */
export function getScope(): Scope | undefined {
  return getContext<Scope | undefined>(SCOPE_KEY);
}
