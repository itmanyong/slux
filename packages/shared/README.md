# @slux/shared

🧰 全仓库复用的纯工具库，运行时**零依赖**，只做两件事：按迭代顺序执行全部同步任务并汇总错误（`runAll`），以及生成 `unplugin-auto-import` 的自动导入配置（`createAutoImports` / `generateBatchAutoImports`）。

[![GITHUB](https://img.shields.io/badge/GITHUB-181717?style=for-the-badge&logo=github&logoColor=white&color=green)](https://github.com/itmanyong/slux/tree/main/packages/shared) [![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white&color=orange)](https://www.npmjs.com/package/@slux/shared) [![文档](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E6%96%87%E6%A1%A3-0F766E?style=for-the-badge&color=blue)](https://itmanyong.github.io/slux/packages/shared/)

它**不包含**响应式节点、依赖追踪、调度状态、作用域或框架适配逻辑，这些能力属于 `@slux/core` 与各范式包。与各包的关系：`@slux/core` 用 `runAll` 保证单个通知 / effect 抛错不阻断其余任务；各包公开的 `createAutoImportApis(prefix?)` 都基于本包的 `generateBatchAutoImports` 拼装。

| 💡 项            | 值                                                                | 来源                     |
| ---------------- | ----------------------------------------------------------------- | ------------------------ |
| 包名 / 版本      | `@slux/shared` `0.2.4`                                            | `package.json`           |
| 运行时依赖       | 无（没有 `dependencies` 字段）                                    | `package.json`           |
| peer / 可选 peer | 无                                                                | `package.json`           |
| 子入口           | 无，只有 `.` 与 `./package.json`                                  | `package.json` `exports` |
| 模块格式         | ESM `dist/index.js` + CJS `dist/index.cjs`，带 `.d.ts` / `.d.cts` | `package.json` `exports` |
| `sideEffects`    | `false`                                                           | `package.json`           |
| 许可             | MIT                                                               | `package.json`           |

## 特性与适用场景

| 🧩 能力                                      | 什么时候用                                                  | 对应导出                   |
| -------------------------------------------- | ----------------------------------------------------------- | -------------------------- |
| 执行一批同步任务，失败互不阻断、错误统一汇总 | 通知队列、effect 刷新、多个清理钩子等「全部都要跑完」的场景 | `runAll`                   |
| 把一组 API 名登记为可自动导入的标识符        | 为某个包生成 `unplugin-auto-import` 的 `ImportsMap`         | `createAutoImports`        |
| 合并多个配置来源                             | 一份构建配置里同时登记多个包，或同名来源分多次登记          | `generateBatchAutoImports` |
| 描述前缀、API 清单与来源名                   | 调用上面两个函数时的入参类型                                | `AutoImportsConfig`        |

🧩 不适合：需要响应式状态、调度、作用域或异步任务编排时，请改用 `@slux/core` 及上层范式包——本包只提供无业务语义的同步工具。

## 安装

```sh
pnpm add @slux/shared
```

| 📦 项                                       | 情况                                                                                                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dependencies`                              | 无，本包不含任何运行时依赖                                                                                                                                 |
| `peerDependencies` / `peerDependenciesMeta` | 无                                                                                                                                                         |
| 可选 peer                                   | 无                                                                                                                                                         |
| 子入口                                      | 无；全部导出从 `@slux/shared` 主入口导入                                                                                                                   |
| `unplugin-auto-import`                      | 仅列在 `devDependencies`。`src/plugin/auto-import-api.ts` 通过 `import type { ImportsMap } from "unplugin-auto-import/types"` 引用其类型，运行时不加载该包 |

📦 多数情况下本包作为 `@slux/core`、`@slux/atom`、`@slux/proxy` 等的间接依赖被带入；若应用代码直接调用 `createAutoImports` 并把结果交给 `unplugin-auto-import` 插件，需自行安装该插件。通用约定与仓库内验证命令集中在仓库根 [README](../../README.md)（「框架适配 · 通用约定」「Store 中间件 · 通用契约」「本地开发」），本包不重复。

## 快速开始

```ts
import { createAutoImports, generateBatchAutoImports, runAll } from "@slux/shared";

// 执行全部同步任务，按迭代顺序调用
const values: number[] = [];
runAll([
  () => {
    values.push(1);
  },
  () => {
    values.push(2);
  },
]);
// values === [1, 2]

// 生成一份带前缀别名的自动导入配置
const coreImports = createAutoImports({
  prefix: "u",
  fromName: "@slux/core",
  imports: ["signal", "effect"],
});
// { "@slux/core": [["signal", "uSignal"], ["effect", "uEffect"]] }

// 合并多个配置来源（同名来源会拼接）
const merged = generateBatchAutoImports([
  { fromName: "@slux/core", imports: ["signal"] },
  { fromName: "@slux/core", imports: ["effect"] },
  { fromName: "@slux/atom", imports: ["atom"] },
]);
// { "@slux/core": ["signal", "effect"], "@slux/atom": ["atom"] }
```

## 核心 API

### `runAll`

`runAll(tasks: Iterable<() => void>): void`

| 💡 行为  | 说明                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------- |
| 执行方式 | `for...of` 按迭代顺序逐个调用任务，**全部执行完毕后**才处理错误                                 |
| 任务抛错 | 捕获后继续后续任务，不阻断                                                                      |
| 单个错误 | 原样重新抛出（`throw errors[0]`），可以是任意值：`undefined`、字符串、非 `Error` 对象都保留原值 |
| 多个错误 | 抛出 `new AggregateError(errors, "多个任务执行失败")`，`errors` 按抛出顺序保留原值              |
| 无错误   | 正常返回 `void`                                                                                 |
| 异步     | 只做同步调用，不 `await` 返回值；任务返回 `Promise` 时不会等待其完成                            |

```ts
import { runAll } from "@slux/shared";

// 单个错误：原样抛出，但后续任务仍执行
const done: number[] = [];
try {
  runAll([
    () => {
      throw new Error("task");
    },
    () => {
      done.push(2);
    },
  ]);
} catch (error) {
  // error 就是上面那个 Error("task")
}
// done === [2]

// 多个错误：AggregateError，保留非 Error 的抛出值
try {
  runAll([
    () => {
      throw undefined;
    },
    () => {
      throw "second";
    },
  ]);
} catch (error) {
  // error instanceof AggregateError，(error as AggregateError).errors === [undefined, "second"]
}
```

迭代期间新增的条目是否执行，由传入迭代器的语义决定：源码用 `for...of` 迭代，因此像 `Set` 这样在遍历中 `add` 的任务会被继续执行；`Array` 的快照则不会。

### `createAutoImports`

`createAutoImports(config?: AutoImportsConfig): ImportsMap`

返回 `unplugin-auto-import` 的 `ImportsMap`（类型来自 `unplugin-auto-import/types`）。`config` 可省略，默认 `{}`。

| `config` 字段 | 类型        | 说明                                                          |
| ------------- | ----------- | ------------------------------------------------------------- |
| `prefix`      | `string?`   | 可选前缀；提供后为每个 API 生成别名                           |
| `imports`     | `string[]?` | 要登记的 API 名清单                                           |
| `fromName`    | `string?`   | 导入来源名，通常是包名（如 `"@slux/core"`），也是返回对象的键 |

| 💡 条件                                                | 返回值                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `imports` 或 `fromName` 缺失（或传入 `{}` / 无参调用） | `{}`                                                               |
| 无 `prefix`                                            | `{ [fromName]: [...imports] }`，条目是 API 名字符串                |
| 有 `prefix`                                            | `{ [fromName]: [[name, alias], ...] }`，条目是 `[原名, 别名]` 元组 |

**别名与前缀大写规则**：仅当 `prefix` 非空且**最后一个字符是小写 ASCII 字母**（源码 `/[a-z]$/.test(prefix)`）时，API 名首字母才被大写（`name.at(0).toUpperCase() + name.slice(1)`）；否则 API 名原样拼接。别名 = `prefix` + 处理后的名字。

| `prefix`    | `/[a-z]$/.test(prefix)` | 以 `signal` 为例的别名              |
| ----------- | ----------------------- | ----------------------------------- |
| 未传 / `""` | —                       | 不生成别名，条目为字符串 `"signal"` |
| `"u"`       | `true`                  | `"uSignal"`                         |
| `"ux"`      | `true`                  | `"uxSignal"`                        |
| `"U"`       | `false`                 | `"Usignal"`                         |
| `"u1"`      | `false`                 | `"u1signal"`                        |

### `generateBatchAutoImports`

`generateBatchAutoImports(apis: Array<AutoImportsConfig>): ImportsMap`

按顺序 `reduce` 合并每一项 `createAutoImports` 的结果：

- 若某项的 `fromName` 在结果中已存在，且该项能生成导入条目，则把新条目 `push` 到已有数组末尾（原地拼接）。
- 否则用对象展开合并该项结果；无效项（`{}`）不影响结果。

因此多个配置项共享同一 `fromName` 时，API 会合并进同一个数组，不会互相覆盖。

### `AutoImportsConfig`

```ts
interface AutoImportsConfig {
  prefix?: string;
  imports?: string[];
  fromName?: string;
}
```

三个字段均可选，由 `createAutoImports` / `generateBatchAutoImports` 消费。

## 关键语义与边界

- ⚠️ **只处理同步执行**：`runAll` 不等待异步任务，也不监听 `Promise` 的拒绝；任务异步抛出的错误不在本函数汇总范围内。
- **错误不阻断**：先跑完全部任务，再统一抛出；「单个原样抛、多个 `AggregateError`」是对抛出值本身的处理，不做 `Error` 归一化。
- **不提供 `createAutoImportApis`**：本包是自动导入能力的**底层生成器**，只导出 `createAutoImports` 与 `generateBatchAutoImports`。各范式包 / 框架包用自己的 API 清单调用 `generateBatchAutoImports`，对外公开各自的 `createAutoImportApis(prefix?)`。
- **职责边界**：无响应式节点、无依赖追踪、无调度队列、无作用域、无生命周期、无框架适配；不读写全局状态，也不持有订阅。`runAll` 只接收调用方给的任务，不决定任务内容。
- **无运行时依赖**：`unplugin-auto-import` 只以 `import type` 出现在源码中，打包产物不会在运行时加载它。

## 自动导入配置

🔌 本包自身没有 `createAutoImportApis` 函数；`src/auto-import-api.ts` 中的 `allImportApis` 是由 `scripts/generate-import-apis.mjs` 按 `src/index.ts` 的运行时导出维护的清单，**未从 `src/index.ts` 导出**，当前内容为：

```ts
export const allImportApis: string[] = ["createAutoImports", "generateBatchAutoImports", "runAll"];
```

要为本包生成自动导入配置，直接使用 `createAutoImports`：

```ts
// vite / rspack / rollup 等支持 unplugin 的构建配置
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImports } from "@slux/shared";

export default {
  plugins: [
    AutoImport({
      imports: [
        createAutoImports({
          fromName: "@slux/shared",
          imports: ["runAll", "createAutoImports", "generateBatchAutoImports"],
        }),
      ],
    }),
  ],
};
```

前缀别名的大小写规则由本包的 `createAutoImports` 统一决定（见上文表格），各包的 `createAutoImportApis(prefix?)` 沿用同一规则。

## 类型导出

💡 `src/index.ts` 中唯一的 `export type`：

| 💡 类型             | 用途                                                 |
| ------------------- | ---------------------------------------------------- |
| `AutoImportsConfig` | `{ prefix?, imports?, fromName? }`，自动导入配置入参 |

`ImportsMap` 来自 `unplugin-auto-import/types`，本包只引用、**不重新导出**；需要该类型时从 `unplugin-auto-import` 获取。

## 不适用的场景 / 与其他包分工

| ⚠️ 需求                                     | 应使用的包                                            |
| ------------------------------------------- | ----------------------------------------------------- |
| 需要信号、计算属性、effect、批处理、作用域  | `@slux/core`                                          |
| 需要 atom / store / proxy 等状态组织范式    | `@slux/atom` / `@slux/store` / `@slux/proxy` 等       |
| 需要框架绑定（hooks、Ref、Signal 等）       | 对应的 `@slux/react` 等适配包                         |
| 需要执行一批同步任务并汇总错误              | 本包 `runAll`                                         |
| 需要生成 / 合并 `unplugin-auto-import` 配置 | 本包 `createAutoImports` / `generateBatchAutoImports` |

## 版本、许可与反馈

- 📚 版本：`0.2.4`（`package.json`）。
- 许可：MIT，见仓库根 [LICENSE](../../LICENSE)。
- 问题反馈：[GitHub Issues](https://github.com/itmanyong/slux/issues)（`package.json` `bugs.url`）。

<!-- package-navigation:start -->

## 包导航

### 核心层

响应式运行时与零依赖工具，其余各层都建立在 core 之上。

| 📦 包名                                                                       | 版本                                                                                                                                                                                                                                  | 文档                                                     | 功能                   |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------- |
| [`@slux/core`](https://github.com/itmanyong/slux/tree/main/packages/core)     | [![npm version](https://img.shields.io/npm/v/@slux/core)](https://www.npmjs.com/package/@slux/core) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/core?label=npmx)](https://npmx.dev/package/@slux/core)         | [文档](https://itmanyong.github.io/slux/packages/core)   | 框架无关的响应式运行时 |
| [`@slux/shared`](https://github.com/itmanyong/slux/tree/main/packages/shared) | [![npm version](https://img.shields.io/npm/v/@slux/shared)](https://www.npmjs.com/package/@slux/shared) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/shared?label=npmx)](https://npmx.dev/package/@slux/shared) | [文档](https://itmanyong.github.io/slux/packages/shared) | 零依赖的共享工具       |

### 范式层

六种组织状态的方式，共享 core 的运行时，可在同一个依赖图中混用。

| 📦 包名                                                                                     | 版本                                                                                                                                                                                                                                                              | 文档                                                            | 功能                               |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------- |
| [`@slux/store`](https://github.com/itmanyong/slux/tree/main/packages/store)                 | [![npm version](https://img.shields.io/npm/v/@slux/store)](https://www.npmjs.com/package/@slux/store) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/store?label=npmx)](https://npmx.dev/package/@slux/store)                                 | [文档](https://itmanyong.github.io/slux/packages/store)         | 状态与 action 集中管理，支持中间件 |
| [`@slux/atom`](https://github.com/itmanyong/slux/tree/main/packages/atom)                   | [![npm version](https://img.shields.io/npm/v/@slux/atom)](https://www.npmjs.com/package/@slux/atom) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/atom?label=npmx)](https://npmx.dev/package/@slux/atom)                                     | [文档](https://itmanyong.github.io/slux/packages/atom)          | 细粒度原子状态与派生               |
| [`@slux/proxy`](https://github.com/itmanyong/slux/tree/main/packages/proxy)                 | [![npm version](https://img.shields.io/npm/v/@slux/proxy)](https://www.npmjs.com/package/@slux/proxy) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/proxy?label=npmx)](https://npmx.dev/package/@slux/proxy)                                 | [文档](https://itmanyong.github.io/slux/packages/proxy)         | 可变代理写入与只读快照             |
| [`@slux/flux`](https://github.com/itmanyong/slux/tree/main/packages/flux)                   | [![npm version](https://img.shields.io/npm/v/@slux/flux)](https://www.npmjs.com/package/@slux/flux) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/flux?label=npmx)](https://npmx.dev/package/@slux/flux)                                     | [文档](https://itmanyong.github.io/slux/packages/flux)          | reducer + dispatch 范式            |
| [`@slux/state-machine`](https://github.com/itmanyong/slux/tree/main/packages/state-machine) | [![npm version](https://img.shields.io/npm/v/@slux/state-machine)](https://www.npmjs.com/package/@slux/state-machine) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/state-machine?label=npmx)](https://npmx.dev/package/@slux/state-machine) | [文档](https://itmanyong.github.io/slux/packages/state-machine) | 平面有限状态机                     |
| [`@slux/rxjs`](https://github.com/itmanyong/slux/tree/main/packages/rxjs)                   | [![npm version](https://img.shields.io/npm/v/@slux/rxjs)](https://www.npmjs.com/package/@slux/rxjs) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/rxjs?label=npmx)](https://npmx.dev/package/@slux/rxjs)                                     | [文档](https://itmanyong.github.io/slux/packages/rxjs)          | Observable 与状态双向桥接          |

### 中间件层

挂载到 Store 的横切能力，五个包共用同一套契约。

| 📦 包名                                                                             | 版本                                                                                                                                                                                                                                              | 文档                                                        | 功能                 |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------- |
| [`@slux/storage`](https://github.com/itmanyong/slux/tree/main/packages/storage)     | [![npm version](https://img.shields.io/npm/v/@slux/storage)](https://www.npmjs.com/package/@slux/storage) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/storage?label=npmx)](https://npmx.dev/package/@slux/storage)         | [文档](https://itmanyong.github.io/slux/packages/storage)   | 状态持久化与恢复     |
| [`@slux/history`](https://github.com/itmanyong/slux/tree/main/packages/history)     | [![npm version](https://img.shields.io/npm/v/@slux/history)](https://www.npmjs.com/package/@slux/history) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/history?label=npmx)](https://npmx.dev/package/@slux/history)         | [文档](https://itmanyong.github.io/slux/packages/history)   | 撤销与重做           |
| [`@slux/tab-sync`](https://github.com/itmanyong/slux/tree/main/packages/tab-sync)   | [![npm version](https://img.shields.io/npm/v/@slux/tab-sync)](https://www.npmjs.com/package/@slux/tab-sync) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/tab-sync?label=npmx)](https://npmx.dev/package/@slux/tab-sync)     | [文档](https://itmanyong.github.io/slux/packages/tab-sync)  | 跨标签页状态同步     |
| [`@slux/telemetry`](https://github.com/itmanyong/slux/tree/main/packages/telemetry) | [![npm version](https://img.shields.io/npm/v/@slux/telemetry)](https://www.npmjs.com/package/@slux/telemetry) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/telemetry?label=npmx)](https://npmx.dev/package/@slux/telemetry) | [文档](https://itmanyong.github.io/slux/packages/telemetry) | 状态变化与订阅遥测   |
| [`@slux/devtools`](https://github.com/itmanyong/slux/tree/main/packages/devtools)   | [![npm version](https://img.shields.io/npm/v/@slux/devtools)](https://www.npmjs.com/package/@slux/devtools) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/devtools?label=npmx)](https://npmx.dev/package/@slux/devtools)     | [文档](https://itmanyong.github.io/slux/packages/devtools)  | 调试工具、日志与检查 |

### 框架层

十二个绑定包都提供 core 主入口与六个范式子入口，使用框架原生响应式与生命周期。范式包是**可选** peer，只装实际使用的；`@slux/core` 与框架本身是**必需** peer。

| 📦 包名                                                                         | 版本                                                                                                                                                                                                                                      | 文档                                                      | 适配框架                                        | 适配版本                                   |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------ |
| [`@slux/react`](https://github.com/itmanyong/slux/tree/main/packages/react)     | [![npm version](https://img.shields.io/npm/v/@slux/react)](https://www.npmjs.com/package/@slux/react) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/react?label=npmx)](https://npmx.dev/package/@slux/react)         | [文档](https://itmanyong.github.io/slux/packages/react)   | [React](https://github.com/react/react)         | `^18.0.0 ‖ ^19.0.0`                        |
| [`@slux/vue`](https://github.com/itmanyong/slux/tree/main/packages/vue)         | [![npm version](https://img.shields.io/npm/v/@slux/vue)](https://www.npmjs.com/package/@slux/vue) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/vue?label=npmx)](https://npmx.dev/package/@slux/vue)                 | [文档](https://itmanyong.github.io/slux/packages/vue)     | [Vue](https://github.com/vuejs/core)            | `>= 3.2.0`                                 |
| [`@slux/solid`](https://github.com/itmanyong/slux/tree/main/packages/solid)     | [![npm version](https://img.shields.io/npm/v/@slux/solid)](https://www.npmjs.com/package/@slux/solid) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/solid?label=npmx)](https://npmx.dev/package/@slux/solid)         | [文档](https://itmanyong.github.io/slux/packages/solid)   | [Solid](https://github.com/solidjs/solid)       | `>= 1.0.0`                                 |
| [`@slux/svelte`](https://github.com/itmanyong/slux/tree/main/packages/svelte)   | [![npm version](https://img.shields.io/npm/v/@slux/svelte)](https://www.npmjs.com/package/@slux/svelte) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/svelte?label=npmx)](https://npmx.dev/package/@slux/svelte)     | [文档](https://itmanyong.github.io/slux/packages/svelte)  | [Svelte](https://github.com/sveltejs/svelte)    | `>= 4.0.0`                                 |
| [`@slux/angular`](https://github.com/itmanyong/slux/tree/main/packages/angular) | [![npm version](https://img.shields.io/npm/v/@slux/angular)](https://www.npmjs.com/package/@slux/angular) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/angular?label=npmx)](https://npmx.dev/package/@slux/angular) | [文档](https://itmanyong.github.io/slux/packages/angular) | [Angular](https://github.com/angular/angular)   | `@angular/core >= 16.0.0`、`rxjs >= 7.8.0` |
| [`@slux/preact`](https://github.com/itmanyong/slux/tree/main/packages/preact)   | [![npm version](https://img.shields.io/npm/v/@slux/preact)](https://www.npmjs.com/package/@slux/preact) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/preact?label=npmx)](https://npmx.dev/package/@slux/preact)     | [文档](https://itmanyong.github.io/slux/packages/preact)  | [Preact](https://github.com/preactjs/preact)    | `>= 10.5.0`                                |
| [`@slux/ripple`](https://github.com/itmanyong/slux/tree/main/packages/ripple)   | [![npm version](https://img.shields.io/npm/v/@slux/ripple)](https://www.npmjs.com/package/@slux/ripple) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/ripple?label=npmx)](https://npmx.dev/package/@slux/ripple)     | [文档](https://itmanyong.github.io/slux/packages/ripple)  | [Ripple](https://github.com/Ripple-TS/ripple)   | `>= 0.6.0`                                 |
| [`@slux/inferno`](https://github.com/itmanyong/slux/tree/main/packages/inferno) | [![npm version](https://img.shields.io/npm/v/@slux/inferno)](https://www.npmjs.com/package/@slux/inferno) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/inferno?label=npmx)](https://npmx.dev/package/@slux/inferno) | [文档](https://itmanyong.github.io/slux/packages/inferno) | [Inferno](https://github.com/infernojs/inferno) | `>= 7.0.0`                                 |
| [`@slux/octane`](https://github.com/itmanyong/slux/tree/main/packages/octane)   | [![npm version](https://img.shields.io/npm/v/@slux/octane)](https://www.npmjs.com/package/@slux/octane) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/octane?label=npmx)](https://npmx.dev/package/@slux/octane)     | [文档](https://itmanyong.github.io/slux/packages/octane)  | [Octane](https://github.com/octanejs/octane)    | `>= 0.16.0`                                |
| [`@slux/vitarx`](https://github.com/itmanyong/slux/tree/main/packages/vitarx)   | [![npm version](https://img.shields.io/npm/v/@slux/vitarx)](https://www.npmjs.com/package/@slux/vitarx) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/vitarx?label=npmx)](https://npmx.dev/package/@slux/vitarx)     | [文档](https://itmanyong.github.io/slux/packages/vitarx)  | [Vitarx](https://github.com/vitarx-lib/core)    | `>= 4.0.0`                                 |
| [`@slux/actview`](https://github.com/itmanyong/slux/tree/main/packages/actview) | [![npm version](https://img.shields.io/npm/v/@slux/actview)](https://www.npmjs.com/package/@slux/actview) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/actview?label=npmx)](https://npmx.dev/package/@slux/actview) | [文档](https://itmanyong.github.io/slux/packages/actview) | [ActView](https://github.com/actview/actview)   | `>= 1.0.0`                                 |
| [`@slux/viewfly`](https://github.com/itmanyong/slux/tree/main/packages/viewfly) | [![npm version](https://img.shields.io/npm/v/@slux/viewfly)](https://www.npmjs.com/package/@slux/viewfly) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/viewfly?label=npmx)](https://npmx.dev/package/@slux/viewfly) | [文档](https://itmanyong.github.io/slux/packages/viewfly) | [Viewfly](https://github.com/viewfly/viewfly)   | `>= 3.0.0`                                 |

格式差异：**Octane** 的公开入口是 TypeScript 源码，需消费端 Octane 编译器处理且不提供 CJS；**Ripple** 只发布 ESM，另有 `./server` 服务端入口。其余边界见各包文档。

### 插件层

**规划中**

| 包名 | 版本 | 文档 | 功能 |
| ---- | ---- | ---- | ---- |
| —    | —    | —    | —    |

<!-- package-navigation:end -->
