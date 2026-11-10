# @slux/shared

全仓库复用的纯工具库，运行时**零依赖**，只做两件事：按迭代顺序执行全部同步任务并汇总错误（`runAll`），以及生成 `unplugin-auto-import` 的自动导入配置（`createAutoImports` / `generateBatchAutoImports`）。

它**不包含**响应式节点、依赖追踪、调度状态、作用域或框架适配逻辑，这些能力属于 `@slux/core` 与各范式包。与各包的关系：`@slux/core` 用 `runAll` 保证单个通知 / effect 抛错不阻断其余任务；各包公开的 `createAutoImportApis(prefix?)` 都基于本包的 `generateBatchAutoImports` 拼装。

| 项               | 值                                                                | 来源                     |
| ---------------- | ----------------------------------------------------------------- | ------------------------ |
| 包名 / 版本      | `@slux/shared` `0.1.0`                                            | `package.json`           |
| 运行时依赖       | 无（没有 `dependencies` 字段）                                    | `package.json`           |
| peer / 可选 peer | 无                                                                | `package.json`           |
| 子入口           | 无，只有 `.` 与 `./package.json`                                  | `package.json` `exports` |
| 模块格式         | ESM `dist/index.js` + CJS `dist/index.cjs`，带 `.d.ts` / `.d.cts` | `package.json` `exports` |
| `sideEffects`    | `false`                                                           | `package.json`           |
| 许可             | MIT                                                               | `package.json`           |

## 特性与适用场景

| 能力                                         | 什么时候用                                                  | 对应导出                   |
| -------------------------------------------- | ----------------------------------------------------------- | -------------------------- |
| 执行一批同步任务，失败互不阻断、错误统一汇总 | 通知队列、effect 刷新、多个清理钩子等「全部都要跑完」的场景 | `runAll`                   |
| 把一组 API 名登记为可自动导入的标识符        | 为某个包生成 `unplugin-auto-import` 的 `ImportsMap`         | `createAutoImports`        |
| 合并多个配置来源                             | 一份构建配置里同时登记多个包，或同名来源分多次登记          | `generateBatchAutoImports` |
| 描述前缀、API 清单与来源名                   | 调用上面两个函数时的入参类型                                | `AutoImportsConfig`        |

不适合：需要响应式状态、调度、作用域或异步任务编排时，请改用 `@slux/core` 及上层范式包——本包只提供无业务语义的同步工具。

## 安装

```sh
pnpm add @slux/shared
```

| 项                                          | 情况                                                                                                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dependencies`                              | 无，本包不含任何运行时依赖                                                                                                                                 |
| `peerDependencies` / `peerDependenciesMeta` | 无                                                                                                                                                         |
| 可选 peer                                   | 无                                                                                                                                                         |
| 子入口                                      | 无；全部导出从 `@slux/shared` 主入口导入                                                                                                                   |
| `unplugin-auto-import`                      | 仅列在 `devDependencies`。`src/plugin/auto-import-api.ts` 通过 `import type { ImportsMap } from "unplugin-auto-import/types"` 引用其类型，运行时不加载该包 |

多数情况下本包作为 `@slux/core`、`@slux/atom`、`@slux/proxy` 等的间接依赖被带入；若应用代码直接调用 `createAutoImports` 并把结果交给 `unplugin-auto-import` 插件，需自行安装该插件。通用约定与仓库内验证命令集中在仓库根 [README](../../README.md)（「框架适配 · 通用约定」「Store 中间件 · 通用契约」「本地开发」），本包不重复。

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

| 行为     | 说明                                                                                            |
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

| 条件                                                   | 返回值                                                             |
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

- **只处理同步执行**：`runAll` 不等待异步任务，也不监听 `Promise` 的拒绝；任务异步抛出的错误不在本函数汇总范围内。
- **错误不阻断**：先跑完全部任务，再统一抛出；「单个原样抛、多个 `AggregateError`」是对抛出值本身的处理，不做 `Error` 归一化。
- **不提供 `createAutoImportApis`**：本包是自动导入能力的**底层生成器**，只导出 `createAutoImports` 与 `generateBatchAutoImports`。各范式包 / 框架包用自己的 API 清单调用 `generateBatchAutoImports`，对外公开各自的 `createAutoImportApis(prefix?)`。
- **职责边界**：无响应式节点、无依赖追踪、无调度队列、无作用域、无生命周期、无框架适配；不读写全局状态，也不持有订阅。`runAll` 只接收调用方给的任务，不决定任务内容。
- **无运行时依赖**：`unplugin-auto-import` 只以 `import type` 出现在源码中，打包产物不会在运行时加载它。

## 自动导入配置

本包自身没有 `createAutoImportApis` 函数；`src/auto-import-api.ts` 中的 `allImportApis` 是由 `scripts/generate-import-apis.mjs` 按 `src/index.ts` 的运行时导出维护的清单，**未从 `src/index.ts` 导出**，当前内容为：

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

`src/index.ts` 中唯一的 `export type`：

| 类型                | 用途                                                 |
| ------------------- | ---------------------------------------------------- |
| `AutoImportsConfig` | `{ prefix?, imports?, fromName? }`，自动导入配置入参 |

`ImportsMap` 来自 `unplugin-auto-import/types`，本包只引用、**不重新导出**；需要该类型时从 `unplugin-auto-import` 获取。

## 不适用的场景 / 与其他包分工

| 需求                                        | 应使用的包                                            |
| ------------------------------------------- | ----------------------------------------------------- |
| 需要信号、计算属性、effect、批处理、作用域  | `@slux/core`                                          |
| 需要 atom / store / proxy 等状态组织范式    | `@slux/atom` / `@slux/store` / `@slux/proxy` 等       |
| 需要框架绑定（hooks、Ref、Signal 等）       | 对应的 `@slux/react` 等适配包                         |
| 需要执行一批同步任务并汇总错误              | 本包 `runAll`                                         |
| 需要生成 / 合并 `unplugin-auto-import` 配置 | 本包 `createAutoImports` / `generateBatchAutoImports` |

## 版本、许可与反馈

- 版本：`0.1.0`（`package.json`）。
- 许可：MIT，见仓库根 [LICENSE](../../LICENSE)。
- 问题反馈：`https://github.com/itmanyong/slux/issues`（`package.json` `bugs.url`）。
