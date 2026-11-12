/**
 * @file @slux/shared 公共入口：汇总批处理工具 runAll 与自动导入配置生成器。
 */
export { runAll } from "./utils/run-all.js";
export { createAutoImports, generateBatchAutoImports } from "./plugin/auto-import-api.js";
export type { AutoImportsConfig } from "./plugin/auto-import-api.js";
