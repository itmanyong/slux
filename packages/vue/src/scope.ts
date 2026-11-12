/**
 * @file Vue 适配层的 Scope 依赖注入：定义注入键与插件选项，提供
 * provideScope / useScope / ScopeProvider / sluxPlugin 四种注入入口。
 */

import { defineComponent, inject, provide } from "vue";
import type { InjectionKey, Plugin, PropType } from "vue";
import type { Scope } from "@slux/core";

/**
 * 模块内私有的注入键，供 provide / inject 与插件共用。
 * @see provideScope
 * @see useScope
 */
const SCOPE_KEY: InjectionKey<Scope> = Symbol("slux-scope");
/**
 * sluxPlugin 的安装选项类型。
 * @property scope 可选的应用级 Scope；省略时插件不执行任何 provide。
 * @see sluxPlugin
 */
export type SluxPluginOptions = { readonly scope?: Scope };

/**
 * 在当前组件内提供 Scope，使后代组件的 useScope 能注入到它。
 * @param scope 要提供的 Scope 实例
 * @remarks 须在组件 setup() 期间调用（Vue provide 的约束），提供仅对当前组件子树可见。
 * @see useScope
 * @see ScopeProvider
 */
export function provideScope(scope: Scope): void {
  provide(SCOPE_KEY, scope);
}
/**
 * 读取最近一层提供的 Scope；未注入时返回 undefined，由调用方自行决定回退行为。
 * @returns 当前 Scope，或未注入时的 undefined
 * @remarks 须在组件 setup() 期间调用（Vue inject 的约束），只能读到祖先组件或应用级提供的值。
 * @see provideScope
 */
export function useScope(): Scope | undefined {
  return inject(SCOPE_KEY, undefined);
}
/**
 * 以组件形式把 scope 提供给子树的 Vue 组件；渲染时输出默认插槽内容。
 * 用 defineComponent 声明必填的 scope prop，并在 setup 内调用 provideScope 完成注入，
 * 使模板写法与命令式 provideScope 共用同一套键与生命周期。
 * @remarks provide 发生在 setup 阶段，早于任何渲染。
 * @see provideScope
 * @see useScope
 */
export const ScopeProvider = defineComponent({
  name: "SluxScopeProvider",
  props: { scope: { type: Object as PropType<Scope>, required: true } },
  /**
   * 在 setup 内提供 scope 并返回渲染函数。
   * @param props 组件 props，其中 scope 为必填的 Scope 实例
   * @param slots 插槽集合，此处只用默认插槽
   * @returns 渲染函数，返回默认插槽的渲染结果；无默认插槽时为 undefined
   */
  setup(props, { slots }) {
    provideScope(props.scope);
    return () => slots["default"]?.();
  },
});
/**
 * Vue 应用级插件：安装时若传入 scope，则以应用级 provide 注入，供全应用组件读取。
 * @remarks install 由 app.use 触发；无选项或选项无 scope 时不执行任何注入。
 * @see provideScope
 * @see useScope
 */
export const sluxPlugin: Plugin<[SluxPluginOptions] | []> = {
  /**
   * 插件安装入口：按条件把选项中的 scope 提供到应用级注入。
   * @param app Vue 应用实例
   * @param options 安装选项；未传选项时为 undefined
   */
  install(app, options) {
    if (options?.scope) app.provide(SCOPE_KEY, options.scope);
  },
};
