/**
 * @file tab-sync 包公共入口：汇总跨标签页消息类型、broadcast 中间件与自动导入 API。
 */
export type { BroadcastMessage, BroadcastOptions, ConflictResolution, ConflictResolver } from "./types.js";
export { broadcast } from "./broadcast.js";
export { createAutoImportApis } from "./auto-import-api.js";
