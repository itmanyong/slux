/**
 * @file 把 @slux/core 的 Scope 挂接到 actview 的依赖注入上下文：provideScope 写入、useScope 读取，注入键采用全局 Symbol 保证跨模块一致。
 */
import { provide, useInjects } from "@actview/core";
import type { Scope } from "@slux/core";
/**
 * 注入 Scope 使用的键，供 provideScope 写入、useScope 读取，两端必须一致。
 * 采用 Symbol.for 在全局符号表注册固定键名，跨模块、跨多次求值都返回同一个 Symbol，避免局部 Symbol 导致注入对不上。
 * @remarks 键名字符串是提供端与注入端的跨模块约定，不应随意改动。
 */
export const SCOPE_KEY = Symbol.for("slux.actview.scope");
/**
 * 把 Scope 以 SCOPE_KEY 注入当前 actview 组件上下文，使其对下游组件可读取。
 * 只登记引用、不复制也不接管 Scope，让同一作用域树共享同一个 Scope 实例。
 * @param scope 要提供的 Scope 实例，其创建与销毁由调用方负责
 * @returns 无返回值
 * @remarks 须在组件提供阶段调用，且早于任何下游 useScope 的读取，否则下游读不到。
 * @see useScope 配对的读取端；SCOPE_KEY 注入所用的键
 */
export function provideScope(scope: Scope): void {
  provide(SCOPE_KEY, scope);
}
/**
 * 从当前 actview 组件上下文读取由 provideScope 注入的 Scope。
 * 只做键查找，不创建也不初始化 Scope；未在上游提供时以 undefined 明确表示缺失，而非隐式构造一个空作用域。
 * @returns 上游注入的 Scope；未注入（或不在有效上下文）时为 undefined
 * @remarks 须在 provideScope 之后的下游（或同一上下文）注入阶段调用。
 * @see provideScope 配对的提供端；SCOPE_KEY 注入所用的键
 */
export function useScope(): Scope | undefined {
  return useInjects(SCOPE_KEY) as Scope | undefined;
}
