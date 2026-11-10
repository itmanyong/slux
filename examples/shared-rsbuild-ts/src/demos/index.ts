import type { ExampleDemo, ExampleGroup } from "@slux/shell-example";
import reproRunClean from "./run-clean.ts?raw";
import { createRunClean } from "./run-clean";
import reproRunCollect from "./run-collect.ts?raw";
import { createRunCollect } from "./run-collect";
import reproRunRethrow from "./run-rethrow.ts?raw";
import { createRunRethrow } from "./run-rethrow";
import reproAutoImports from "./auto-imports.ts?raw";
import { createAutoImportsDemo } from "./auto-imports";

const groups = [
  {
    id: "run-all",
    name: "runAll",
    title: "批量执行",
    summary: "执行全部同步任务：失败收拢为 AggregateError，单失败原样重抛。",
  },
  {
    id: "auto-imports",
    name: "auto-imports",
    title: "自动导入配置",
    summary: "createAutoImports 与 generateBatchAutoImports 生成 ImportsMap。",
  },
] as const satisfies readonly ExampleGroup[];

export const demos: ExampleDemo[] = [
  {
    id: "run-clean",
    group: "run-all",
    title: "runAll：全部成功",
    apiLabel: "runAll(tasks)",
    summary: "逐个执行同步任务并留下记录，全部通过时静默返回。",
    repro: reproRunClean,
    reproPath: "src/demos/run-clean.ts",
    create: createRunClean,
  },
  {
    id: "run-collect",
    group: "run-all",
    title: "runAll：失败收拢",
    apiLabel: "runAll(tasks)",
    summary: "一个任务失败不阻断其余任务，错误最终以 AggregateError 收拢。",
    repro: reproRunCollect,
    reproPath: "src/demos/run-collect.ts",
    create: createRunCollect,
  },
  {
    id: "run-rethrow",
    group: "run-all",
    title: "runAll：单失败原样重抛",
    apiLabel: "runAll(tasks)",
    summary: "只有一个任务失败时重抛原始错误，不包装 AggregateError。",
    repro: reproRunRethrow,
    reproPath: "src/demos/run-rethrow.ts",
    create: createRunRethrow,
  },
  {
    id: "auto-imports",
    group: "auto-imports",
    title: "自动导入：生成 ImportsMap",
    apiLabel: "createAutoImports(config)",
    summary: "prefix 映射 API 名（signal → useSignal），批量配置可合并。",
    repro: reproAutoImports,
    reproPath: "src/demos/auto-imports.ts",
    create: createAutoImportsDemo,
  },
];

export { groups };
