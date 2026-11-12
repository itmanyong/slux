/**
 * @file 主入口：定义 Scope context（ScopeContext / ScopeProvider / useScopeContext）、核心 signal hook useSignal，并重导出自动导入配置生成器。
 */

import { createContext, createElement } from "preact";
import type { ComponentChildren } from "preact";
import { useCallback, useContext } from "preact/hooks";
import { useSyncExternalStore } from "preact/compat";
import { effect } from "@slux/core";
import type { Scope, Subscribable } from "@slux/core";

/**
 * 承载当前 Scope 的 Preact context；默认值 null 表示未包裹 ScopeProvider。
 * 采用 Scope | null 联合类型而非抛错，使读取方可显式区分「无 scope」与「有 scope」。
 * @see ScopeProvider
 * @see useScopeContext
 */
export const ScopeContext = createContext<Scope | null>(null);
/**
 * ScopeProvider 的属性类型。
 * @property scope 要下发的 Scope 实例
 * @property children 要渲染的子树，可选，省略时 Provider 无子节点
 */
export type ScopeProviderProps = { scope: Scope; children?: ComponentChildren };
/**
 * 把传入的 Scope 注入 context，使子树内的 useScopeContext 能读到它。
 * 以 createElement 显式构造 Provider 元素（本文件为 .ts 而非 .tsx）。
 * @param scope 要下发的 Scope 实例
 * @param children 要渲染的子树，原样作为 Provider 子节点
 * @returns Provider 元素
 * @see ScopeContext
 * @see useScopeContext
 */
export function ScopeProvider({ scope, children }: ScopeProviderProps) {
  return createElement(ScopeContext.Provider, { value: scope }, children);
}
/**
 * 读取最近一层 ScopeProvider 注入的 Scope；无 Provider 时返回 null，由调用方决定回退行为。
 * @returns 当前 Scope，或未包裹 Provider 时的 null
 * @see ScopeContext
 * @see ScopeProvider
 */
export function useScopeContext(): Scope | null {
  return useContext(ScopeContext);
}
/**
 * 订阅任意 Subscribable 并返回其当前值，值变化时触发重渲染。
 * 除 source.subscribe 外还建立 core effect：computed 派生值只在被读取时才刷新并通知，
 * effect 把其依赖变化接入订阅链，保证派生值更新也能驱动重渲染。
 * @typeParam T Subscribable 承载的值类型
 * @param source 可读且可订阅的数据源，应传入稳定引用
 * @returns 当前值
 * @remarks 卸载或 source 引用变化时按「先退订 source、再 dispose effect」清理；SSR 阶段存在显式作用域时按作用域取值，否则回退全局值
 * @see useScopeContext
 * @see useAtomValue
 */
export function useSignal<T>(source: Subscribable<T>): T {
  const scope = useScopeContext();

  const subscribe = useCallback(
    (notify: () => void) => {
      const unsubscribe = source.subscribe(notify);
      const dispose = effect(() => {
        source.get();
      });
      return () => {
        unsubscribe();
        dispose();
      };
    },
    [source],
  );

  const getSnapshot = useCallback(() => source.get(), [source]);
  const getServerSnapshot = useCallback(() => (scope ? scope.get(source) : source.get()), [scope, source]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
export { createAutoImportApis } from "./auto-import-api.js";
