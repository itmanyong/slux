# slux

slux 是一组以**框架无关的响应式核心**为基础的 TypeScript 状态管理包，按五层组织：核心层（运行时与工具）、范式层（六种状态组织方式）、中间件层（Store 横切能力）、框架层（十二个框架绑定）、插件层（构建时集成，规划中）。

**`slux` = `signal(信号)` + `limu(不可变流)` + `luxury(精致)`**

## 包导航

### 核心层

响应式运行时与零依赖工具，其余各层都建立在 core 之上。

| 包名                                                                          | 版本                                                                                                                                                                                                                                  | 在线文档                                                     | 功能                   |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------- |
| [`@slux/core`](https://github.com/itmanyong/slux/tree/main/packages/core)     | [![npm version](https://img.shields.io/npm/v/@slux/core)](https://www.npmjs.com/package/@slux/core) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/core?label=npmx)](https://npmx.dev/package/@slux/core)         | [在线文档](https://itmanyong.github.io/slux/packages/core)   | 框架无关的响应式运行时 |
| [`@slux/shared`](https://github.com/itmanyong/slux/tree/main/packages/shared) | [![npm version](https://img.shields.io/npm/v/@slux/shared)](https://www.npmjs.com/package/@slux/shared) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/shared?label=npmx)](https://npmx.dev/package/@slux/shared) | [在线文档](https://itmanyong.github.io/slux/packages/shared) | 零依赖的共享工具       |

### 范式层

六种组织状态的方式，共享 core 的运行时，可在同一个依赖图中混用。

| 包名                                                                                        | 版本                                                                                                                                                                                                                                                              | 在线文档                                                            | 功能                               |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------- |
| [`@slux/store`](https://github.com/itmanyong/slux/tree/main/packages/store)                 | [![npm version](https://img.shields.io/npm/v/@slux/store)](https://www.npmjs.com/package/@slux/store) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/store?label=npmx)](https://npmx.dev/package/@slux/store)                                 | [在线文档](https://itmanyong.github.io/slux/packages/store)         | 状态与 action 集中管理，支持中间件 |
| [`@slux/atom`](https://github.com/itmanyong/slux/tree/main/packages/atom)                   | [![npm version](https://img.shields.io/npm/v/@slux/atom)](https://www.npmjs.com/package/@slux/atom) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/atom?label=npmx)](https://npmx.dev/package/@slux/atom)                                     | [在线文档](https://itmanyong.github.io/slux/packages/atom)          | 细粒度原子状态与派生               |
| [`@slux/proxy`](https://github.com/itmanyong/slux/tree/main/packages/proxy)                 | [![npm version](https://img.shields.io/npm/v/@slux/proxy)](https://www.npmjs.com/package/@slux/proxy) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/proxy?label=npmx)](https://npmx.dev/package/@slux/proxy)                                 | [在线文档](https://itmanyong.github.io/slux/packages/proxy)         | 可变代理写入与只读快照             |
| [`@slux/flux`](https://github.com/itmanyong/slux/tree/main/packages/flux)                   | [![npm version](https://img.shields.io/npm/v/@slux/flux)](https://www.npmjs.com/package/@slux/flux) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/flux?label=npmx)](https://npmx.dev/package/@slux/flux)                                     | [在线文档](https://itmanyong.github.io/slux/packages/flux)          | reducer + dispatch 范式            |
| [`@slux/state-machine`](https://github.com/itmanyong/slux/tree/main/packages/state-machine) | [![npm version](https://img.shields.io/npm/v/@slux/state-machine)](https://www.npmjs.com/package/@slux/state-machine) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/state-machine?label=npmx)](https://npmx.dev/package/@slux/state-machine) | [在线文档](https://itmanyong.github.io/slux/packages/state-machine) | 平面有限状态机                     |
| [`@slux/rxjs`](https://github.com/itmanyong/slux/tree/main/packages/rxjs)                   | [![npm version](https://img.shields.io/npm/v/@slux/rxjs)](https://www.npmjs.com/package/@slux/rxjs) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/rxjs?label=npmx)](https://npmx.dev/package/@slux/rxjs)                                     | [在线文档](https://itmanyong.github.io/slux/packages/rxjs)          | Observable 与状态双向桥接          |

### 中间件层

挂载到 Store 的横切能力，五个包共用同一套契约。

| 包名                                                                                | 版本                                                                                                                                                                                                                                              | 在线文档                                                        | 功能                 |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------- |
| [`@slux/storage`](https://github.com/itmanyong/slux/tree/main/packages/storage)     | [![npm version](https://img.shields.io/npm/v/@slux/storage)](https://www.npmjs.com/package/@slux/storage) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/storage?label=npmx)](https://npmx.dev/package/@slux/storage)         | [在线文档](https://itmanyong.github.io/slux/packages/storage)   | 状态持久化与恢复     |
| [`@slux/history`](https://github.com/itmanyong/slux/tree/main/packages/history)     | [![npm version](https://img.shields.io/npm/v/@slux/history)](https://www.npmjs.com/package/@slux/history) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/history?label=npmx)](https://npmx.dev/package/@slux/history)         | [在线文档](https://itmanyong.github.io/slux/packages/history)   | 撤销与重做           |
| [`@slux/tab-sync`](https://github.com/itmanyong/slux/tree/main/packages/tab-sync)   | [![npm version](https://img.shields.io/npm/v/@slux/tab-sync)](https://www.npmjs.com/package/@slux/tab-sync) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/tab-sync?label=npmx)](https://npmx.dev/package/@slux/tab-sync)     | [在线文档](https://itmanyong.github.io/slux/packages/tab-sync)  | 跨标签页状态同步     |
| [`@slux/telemetry`](https://github.com/itmanyong/slux/tree/main/packages/telemetry) | [![npm version](https://img.shields.io/npm/v/@slux/telemetry)](https://www.npmjs.com/package/@slux/telemetry) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/telemetry?label=npmx)](https://npmx.dev/package/@slux/telemetry) | [在线文档](https://itmanyong.github.io/slux/packages/telemetry) | 状态变化与订阅遥测   |
| [`@slux/devtools`](https://github.com/itmanyong/slux/tree/main/packages/devtools)   | [![npm version](https://img.shields.io/npm/v/@slux/devtools)](https://www.npmjs.com/package/@slux/devtools) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/devtools?label=npmx)](https://npmx.dev/package/@slux/devtools)     | [在线文档](https://itmanyong.github.io/slux/packages/devtools)  | 调试工具、日志与检查 |

### 框架层

十二个绑定包都提供 core 主入口与六个范式子入口，使用框架原生响应式与生命周期。范式包是**可选** peer，只装实际使用的；`@slux/core` 与框架本身是**必需** peer。

| 包名                                                                            | 版本                                                                                                                                                                                                                                      | 在线文档                                                      | 适配框架                                        | 适配版本                                   | 功能                   |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------ | ---------------------- |
| [`@slux/react`](https://github.com/itmanyong/slux/tree/main/packages/react)     | [![npm version](https://img.shields.io/npm/v/@slux/react)](https://www.npmjs.com/package/@slux/react) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/react?label=npmx)](https://npmx.dev/package/@slux/react)         | [在线文档](https://itmanyong.github.io/slux/packages/react)   | [React](https://github.com/react/react)         | `^18.0.0 ‖ ^19.0.0`                        | React 组件状态绑定     |
| [`@slux/vue`](https://github.com/itmanyong/slux/tree/main/packages/vue)         | [![npm version](https://img.shields.io/npm/v/@slux/vue)](https://www.npmjs.com/package/@slux/vue) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/vue?label=npmx)](https://npmx.dev/package/@slux/vue)                 | [在线文档](https://itmanyong.github.io/slux/packages/vue)     | [Vue](https://github.com/vuejs/core)            | `>= 3.2.0`                                 | Vue 组合式 API 绑定    |
| [`@slux/solid`](https://github.com/itmanyong/slux/tree/main/packages/solid)     | [![npm version](https://img.shields.io/npm/v/@slux/solid)](https://www.npmjs.com/package/@slux/solid) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/solid?label=npmx)](https://npmx.dev/package/@slux/solid)         | [在线文档](https://itmanyong.github.io/slux/packages/solid)   | [Solid](https://github.com/solidjs/solid)       | `>= 1.0.0`                                 | Solid 细粒度响应式绑定 |
| [`@slux/svelte`](https://github.com/itmanyong/slux/tree/main/packages/svelte)   | [![npm version](https://img.shields.io/npm/v/@slux/svelte)](https://www.npmjs.com/package/@slux/svelte) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/svelte?label=npmx)](https://npmx.dev/package/@slux/svelte)     | [在线文档](https://itmanyong.github.io/slux/packages/svelte)  | [Svelte](https://github.com/sveltejs/svelte)    | `>= 4.0.0`                                 | Svelte 原生 store 绑定 |
| [`@slux/angular`](https://github.com/itmanyong/slux/tree/main/packages/angular) | [![npm version](https://img.shields.io/npm/v/@slux/angular)](https://www.npmjs.com/package/@slux/angular) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/angular?label=npmx)](https://npmx.dev/package/@slux/angular) | [在线文档](https://itmanyong.github.io/slux/packages/angular) | [Angular](https://github.com/angular/angular)   | `@angular/core >= 16.0.0`、`rxjs >= 7.8.0` | Angular 注入上下文绑定 |
| [`@slux/preact`](https://github.com/itmanyong/slux/tree/main/packages/preact)   | [![npm version](https://img.shields.io/npm/v/@slux/preact)](https://www.npmjs.com/package/@slux/preact) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/preact?label=npmx)](https://npmx.dev/package/@slux/preact)     | [在线文档](https://itmanyong.github.io/slux/packages/preact)  | [Preact](https://github.com/preactjs/preact)    | `>= 10.5.0`                                | Preact 组件状态绑定    |
| [`@slux/ripple`](https://github.com/itmanyong/slux/tree/main/packages/ripple)   | [![npm version](https://img.shields.io/npm/v/@slux/ripple)](https://www.npmjs.com/package/@slux/ripple) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/ripple?label=npmx)](https://npmx.dev/package/@slux/ripple)     | [在线文档](https://itmanyong.github.io/slux/packages/ripple)  | [Ripple](https://github.com/Ripple-TS/ripple)   | `>= 0.6.0`                                 | Ripple 组件状态绑定    |
| [`@slux/inferno`](https://github.com/itmanyong/slux/tree/main/packages/inferno) | [![npm version](https://img.shields.io/npm/v/@slux/inferno)](https://www.npmjs.com/package/@slux/inferno) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/inferno?label=npmx)](https://npmx.dev/package/@slux/inferno) | [在线文档](https://itmanyong.github.io/slux/packages/inferno) | [Inferno](https://github.com/infernojs/inferno) | `>= 7.0.0`                                 | Inferno 组件状态绑定   |
| [`@slux/octane`](https://github.com/itmanyong/slux/tree/main/packages/octane)   | [![npm version](https://img.shields.io/npm/v/@slux/octane)](https://www.npmjs.com/package/@slux/octane) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/octane?label=npmx)](https://npmx.dev/package/@slux/octane)     | [在线文档](https://itmanyong.github.io/slux/packages/octane)  | [Octane](https://github.com/octanejs/octane)    | `>= 0.16.0`                                | Octane 编译器绑定      |
| [`@slux/vitarx`](https://github.com/itmanyong/slux/tree/main/packages/vitarx)   | [![npm version](https://img.shields.io/npm/v/@slux/vitarx)](https://www.npmjs.com/package/@slux/vitarx) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/vitarx?label=npmx)](https://npmx.dev/package/@slux/vitarx)     | [在线文档](https://itmanyong.github.io/slux/packages/vitarx)  | [Vitarx](https://github.com/vitarx-lib/core)    | `>= 4.0.0`                                 | Vitarx 组件状态绑定    |
| [`@slux/actview`](https://github.com/itmanyong/slux/tree/main/packages/actview) | [![npm version](https://img.shields.io/npm/v/@slux/actview)](https://www.npmjs.com/package/@slux/actview) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/actview?label=npmx)](https://npmx.dev/package/@slux/actview) | [在线文档](https://itmanyong.github.io/slux/packages/actview) | [ActView](https://github.com/actview/actview)   | `>= 1.0.0`                                 | ActView 组件状态绑定   |
| [`@slux/viewfly`](https://github.com/itmanyong/slux/tree/main/packages/viewfly) | [![npm version](https://img.shields.io/npm/v/@slux/viewfly)](https://www.npmjs.com/package/@slux/viewfly) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/viewfly?label=npmx)](https://npmx.dev/package/@slux/viewfly) | [在线文档](https://itmanyong.github.io/slux/packages/viewfly) | [Viewfly](https://github.com/viewfly/viewfly)   | `>= 3.0.0`                                 | Viewfly 组件状态绑定   |

格式差异：**Octane** 的公开入口是 TypeScript 源码，需消费端 Octane 编译器处理且不提供 CJS；**Ripple** 只发布 ESM，另有 `./server` 服务端入口。其余边界见各包文档。

### 插件层

**规划中**

| 包名 | 版本 | 在线文档 | 功能 |
| ---- | ---- | -------- | ---- |
| —    | —    | —        | —    |

## 安装

按需安装，**只装实际用到的层**；应用代码直接 `import` 的包应显式声明在依赖里。

```sh
pnpm add @slux/core                                  # 只用响应式原语
pnpm add @slux/core @slux/store                     # 加一种状态范式
pnpm add @slux/core @slux/store @slux/react react  # 在框架中使用
pnpm add @slux/core @slux/store @slux/storage      # 给 Store 加中间件
```

| 项        | 说明                                                                                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| peer 依赖 | 框架绑定要求框架与 `@slux/core` 为必需 peer；六种范式包是可选 peer，只装实际使用的                                                                    |
| 子入口    | 框架绑定的范式集成从 `@slux/<框架>/<范式>` 导入，如 `@slux/react/store`                                                                               |
| 模块格式  | 核心 / 范式 / 中间件同时提供 ESM、CJS 与类型声明；框架包按各自运行时提供相应格式                                                                      |
| 自动导入  | 多数包提供 `createAutoImportApis(prefix?)` 生成 `unplugin-auto-import` 配置；`@slux/shared` 提供底层 `createAutoImports` / `generateBatchAutoImports` |

> 上表的版本徽章读取 npm registry 中的最新发布版本，显示可能受图片缓存影响；包的实际发布状态以 npm registry 为准。`npm` / `yarn` 可用对应的 `npm install` / `yarn add`。

## 快速开始

只用核心层的最小用例：

```ts
import { computed, effect, signal } from "@slux/core";

const count = signal(1);
const doubled = computed(() => count.get() * 2);

const stop = effect(() => console.log(doubled.get())); // 首次输出 2
count.set(2); // 写入后同步输出 4
stop();
```

各范式的写入方式、框架集成示例与完整可运行应用，见对应包 README 与 [`examples/`](./examples/)。

## 通用约定

以下只列要点，细则与各包差异见对应包 README。

### Store 中间件 · 通用契约

五个中间件都通过 `createStore(creator, { middleware })` 组合：

- `middleware` 是只读数组，每个 Store 使用独立的中间件实例；
- `onSet` 中首个中间件位于最外层，`store.destroy()` 执行各中间件清理；
- 撤销与重做经过完整中间件链。

恢复、过滤、错误处理与 SSR 差异见各中间件包 README。

### 框架适配 · 通用约定

十二个绑定共享：

- core 绑定走主入口，六种范式走 `/atom` … `/rxjs` 子入口，范式包为可选 peer；
- Scope 沿用 core 的显式覆盖语义，computed 不在 Scope 内自动重算；
- SSR 不建立组件订阅，也不自动序列化或恢复状态。

每个框架的入口名、原生绑定形式与专属约束见对应包 README。

### 本地开发

面向仓库贡献者：Node.js 24+、pnpm 12.15.0，根目录 `pnpm install` 后使用 `package.json` 的 `build` / `test` / `typecheck` / `lint` 脚本，单包验证用 `pnpm --filter @slux/<包名> <脚本>`。安装时 `prepare` 会通过 `simple-git-hooks` 设置 `pre-commit` 钩子；提交时 `lint-staged` 只检查暂存的受支持文件，并自动应用 Rstack lint 与格式化修复。修改钩子配置后可运行 `pnpm run prepare` 重新安装钩子。发布命令、Changeset 编写、npm 授信配置及 GitHub Actions 部署步骤见[发布与文档部署](./docs/releasing.md)。

修改上方包导航后运行 `pnpm sync:package-navigation`，把相同导航同步到 25 个包的 README 末尾；再次运行会覆盖旧导航。

## 资源

- **各包 API 与专属边界**：仓库内 `packages/<包名>/README.md`；在线文档见上表「在线文档」列。
- **示例应用**：[`examples/`](./examples/)——25 个包各对应一页「报头 + 分组索引 + 瀑布流卡片 + 日志/源码对照」的演示站，页面外壳统一来自 [`examples/_shell`](./examples/_shell/)（`@slux/shell-example`），与框架无关的演示逻辑沉淀在 [`examples/_kit`](./examples/_kit/)（`@slux/kit-example`）。命名约定：可运行示例为 `@slux/example-*`，`_` 开头的基础设施包为 `@slux/*-example`（只构建、不参与 dev）；端口写死在各包 dev 脚本，从 9000 起逐一递加。根目录 `pnpm examples:dev` 先构建基础设施包，再用一条 `pnpm --filter "@slux/example-*" --parallel run dev` 并发启动全部示例；构建与启动日志照常显示，等 26 个端口全部就绪后停止转发后续日志并统一打印访问链接（总览在最后一行），保证链接不被日志覆盖；dev 异常退出时完整日志写入系统临时文件。总览站 [`examples/_gallery`](./examples/_gallery/)（`@slux/gallery-example`，端口 9000）默认以右上角下拉框选中 core；同一个浮层收起 / 展开都可拖拽、切换不重置位置，右侧上下箭头切换，支持主题同步与「在新窗口打开」。分层入口：
  - **核心层**：[examples/core-rsbuild-ts](./examples/core-rsbuild-ts/README.md)
  - **原语层**（atom / flux / proxy / store / history / storage / state-machine / rxjs）：`examples/<包名>-rsbuild-ts`
  - **中间件层**（shared / telemetry / devtools / tab-sync）：`examples/<包名>-rsbuild-ts`
  - **框架绑定层**（react / vue / solid / preact / inferno / svelte / angular）：`examples/<包名>-rsbuild-ts`；（actview / octane / ripple / viewfly / vitarx）：`examples/<包名>-vite-ts`；每张卡片挂载真实框架组件，「源码」面板即驱动它的最小实现
- **许可**：[MIT](./LICENSE)；**问题反馈**：[GitHub Issues](https://github.com/itmanyong/slux/issues)。
