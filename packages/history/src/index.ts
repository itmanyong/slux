/**
 * @file history 包公共入口：汇总 history 中间件、对外类型与自动导入 API。
 */
export { history } from "./history.js";
export type { HistoryMiddleware, HistoryOptions } from "./types.js";
export type { MiddlewareAPI, SetFn } from "@slux/store";
export { createAutoImportApis } from "./auto-import-api.js";
