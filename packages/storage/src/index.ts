/**
 * @file storage 包的公共导出桶文件，汇总持久化入口、各存储后端、错误码、类型与自动导入 API。
 */
export { persist } from "./persist.js";
export { localStorageBackend, sessionStorageBackend } from "./web-storage.js";
export { cookieStorage } from "./cookie-storage.js";
export { indexedDBStorage } from "./indexed-db-storage.js";
export { memoryStorage } from "./memory-storage.js";
export { PERSIST_ERROR_CODE } from "./errors.js";
export type * from "./types.js";
export { createAutoImportApis } from "./auto-import-api.js";
