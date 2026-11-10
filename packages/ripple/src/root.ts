// "." 入口按 browser / default 条件分流到不同运行时文件，两端 API 必须保持一致。
// 本文件只作为类型入口：构建产物 dist/root.d.ts 是两端导出的并集，
// 供 package.json 的 types 与 exports["."].types 引用，不作为运行时入口。
export { ScopeContext, provideScope, useScopeContext, useSignal } from "./index.js";
export { createAutoImportApis } from "./auto-import-api.js";
