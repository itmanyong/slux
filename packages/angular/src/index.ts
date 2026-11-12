/**
 * @file angular 适配层的公共导出桶文件，汇总作用域桥接、Signal/Observable 互转、store 注入与自动导入 API 的对外符号。
 */

export { SLUX_SCOPE, provideSluxScope, injectScope, toObservable, fromObservable, toAngularSignal } from "./bridge.js";
export type { ToAngularSignalOptions } from "./bridge.js";
export { injectStore } from "./store.js";
export type { InjectStoreOptions } from "./store.js";
export { createAutoImportApis } from "./auto-import-api.js";
