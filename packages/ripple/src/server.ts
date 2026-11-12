/**
 * @file Ripple 适配层的服务端入口：提供不订阅、一次性取值的 useSignal，
 * 导出集合须与客户端入口一致，供 exports["."] 合并类型使用。
 */

import { track } from "ripple";
import type { Derived } from "ripple";
import type { Subscribable } from "@slux/core";
import { useScopeContext } from "./scope.js";

export { ScopeContext, provideScope, useScopeContext } from "./scope.js";

/**
 * 服务端版的 useSignal：按显式 Scope 读取一次当前值，不创建订阅、不建立清理。
 * 与客户端入口同名同签名以维持导出集合一致。
 * @typeParam T source 承载的值类型
 * @param source 可读的数据源，仅在 track 求值时被读取
 * @returns Derived<T>
 * @remarks 优先取显式作用域内的值，无作用域时回退 source.get() 全局值；仅适用于服务端组件初始化。
 * @see useScopeContext
 */
export function useSignal<T>(source: Subscribable<T>): Derived<T> {
  const scope = useScopeContext();
  return track(() => (scope ? scope.get(source) : source.get()));
}

// 导出集合须与客户端入口一致，否则 exports["."] 的合并类型会多出运行时不存在的 API。
export { createAutoImportApis } from "./auto-import-api.js";
