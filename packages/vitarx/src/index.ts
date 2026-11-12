/**
 * @file vitarx 适配层的公共导出入口，汇总 signal hook、作用域（scope）与自动导入 API。
 */
export { useSignal } from "./use-signal.js";
export { provideScope, useScope, SCOPE_KEY } from "./scope.js";
export { createAutoImportApis } from "./auto-import-api.js";
