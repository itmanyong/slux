/**
 * @file svelte 适配层公共入口：汇总 signal、scope 与自动导入 API 的对外符号。
 */
export { toReadable, toWritable } from "./signal.js";
export { SCOPE_KEY, setScope, getScope } from "./scope.js";
export { createAutoImportApis } from "./auto-import-api.js";
