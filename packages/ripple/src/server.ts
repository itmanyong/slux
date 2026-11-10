import { track } from "ripple";
import type { Derived } from "ripple";
import type { Subscribable } from "@slux/core";
import { useScopeContext } from "./scope.js";

export { ScopeContext, provideScope, useScopeContext } from "./scope.js";

/** 在 Ripple 服务端组件初始化中读取显式 Scope，不创建订阅。 */
export function useSignal<T>(source: Subscribable<T>): Derived<T> {
  const scope = useScopeContext();
  return track(() => (scope ? scope.get(source) : source.get()));
}

// 与客户端入口保持相同的导出集合，否则 exports["."] 的合并类型会多出运行时不存在的 API。
export { createAutoImportApis } from "./auto-import-api.js";
