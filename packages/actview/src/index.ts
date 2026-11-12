/**
 * @file actview 适配层的公共导出桶文件，汇总 signal hook、作用域 API 与自动导入配置。
 */
export { useSignal } from "./use-signal.js";
export { provideScope, useScope, SCOPE_KEY } from "./scope.js";
export { createAutoImportApis } from "./auto-import-api.js";
