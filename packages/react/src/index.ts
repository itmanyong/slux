/**
 * @file @slux/react 的公共导出桶文件，汇总 signal、scope、自动导入 API
 * 与 ScopeProviderProps 类型的对外符号。
 */

export { useSignal } from "./use-signal.js";
export { ScopeContext, ScopeProvider, useScopeContext } from "./scope-context.js";
export type { ScopeProviderProps } from "./types.js";
export { createAutoImportApis } from "./auto-import-api.js";
