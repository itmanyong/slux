/**
 * @file @slux/flux 的公共导出桶文件：汇总 createFluxStore 工厂、契约类型与自动导入配置工厂，不含实现逻辑。
 */
export { createFluxStore } from "./create-flux-store.js";
export type { FluxAction, FluxDispatch, FluxMiddleware, FluxMiddlewareAPI, FluxReducer, FluxStore, FluxStoreOptions } from "./types.js";
export { createAutoImportApis } from "./auto-import-api.js";
