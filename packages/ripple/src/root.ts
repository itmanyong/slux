/**
 * @file Ripple 双端共用的类型入口（dist/root.d.ts），汇总两端一致的对外符号 re-export。
 */

// "." 入口按 browser / default 条件分流到不同运行时文件，两端 API 必须保持一致；
// 本文件只作为类型入口，不作为运行时入口。
export { ScopeContext, provideScope, useScopeContext, useSignal } from "./index.js";
export { createAutoImportApis } from "./auto-import-api.js";
