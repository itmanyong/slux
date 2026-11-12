/**
 * @file Vue 适配层的公共导出桶文件，汇总 signal、store、scope 与自动导入 API 的对外符号。
 */

export { useSignal } from "./use-signal.js";
export { useStore } from "./store.js";
export { provideScope, useScope, ScopeProvider, sluxPlugin } from "./scope.js";
export type { SluxPluginOptions } from "./scope.js";
export { createAutoImportApis } from "./auto-import-api.js";
