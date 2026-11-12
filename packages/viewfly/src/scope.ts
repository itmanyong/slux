/**
 * @file 把 @slux/core 的 Scope 挂接到 viewfly 的依赖注入上下文：SLUX_SCOPE 令牌、ScopeProvider 提供、useScope 读取。
 */
import { createContextProvider, inject, InjectionToken } from "@viewfly/core";
import type { Scope } from "@slux/core";
/**
 * 注入 Scope 使用的令牌，供 ScopeProvider 提供、useScope 读取，两端必须引用同一实例。
 * 采用带泛型的 InjectionToken 使注入值在类型上被约束为 Scope，并让提供端与读取端共享一个明确的键。
 * @remarks 字符串 "slux.viewfly.scope" 为构造时传入的标识。
 */
export const SLUX_SCOPE = new InjectionToken<Scope>("slux.viewfly.scope");
/**
 * 由 createContextProvider 基于 SLUX_SCOPE 生成的上下文 Provider，负责把某个 Scope 提供给其下游组件树。
 * 把令牌绑定封装成现成的 Provider，调用方只需在组件树上游使用它。
 * @remarks 须作为 useScope 所在组件的祖先提供；提供的值沿用 viewfly 依赖注入的查找规则。
 * @see SLUX_SCOPE 绑定的注入令牌；useScope 配对的读取端
 */
export const ScopeProvider = createContextProvider({ provide: SLUX_SCOPE });
/**
 * 从当前 viewfly 依赖注入上下文读取由 ScopeProvider 提供的 Scope。
 * 显式把 inject 的默认值设为 undefined，使「上游未提供」成为一个可判定的缺失状态，而不是隐式构造空作用域或抛错。
 * @returns 上游提供的 Scope；未注入（或不在有效 Provider 子树）时为 undefined
 * @remarks 须在 ScopeProvider 下游的注入阶段调用。
 * @see ScopeProvider 配对的提供端；SLUX_SCOPE 注入所用的令牌
 */
export function useScope(): Scope | undefined {
  return inject(SLUX_SCOPE, undefined);
}
