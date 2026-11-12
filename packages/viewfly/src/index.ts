/**
 * @file viewfly 适配层的公共导出桶文件，汇总 signal hook、Accessor 类型、作用域 API 与自动导入配置。
 */
export { useSignal } from "./use-signal.js";
export type { Accessor } from "./binding.js";
export { SLUX_SCOPE, ScopeProvider, useScope } from "./scope.js";
export { createAutoImportApis } from "./auto-import-api.js";
