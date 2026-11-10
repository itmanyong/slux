# @slux/tab-sync

🔄 为 `@slux/store` 提供基于 `BroadcastChannel` 的跨标签页状态同步。`broadcast` 是一个标准 `Middleware<T>`：把本地后续变更广播到同名通道，并把收到的远端消息经完整中间件链应用。它作为 `@slux/store` 中间件接入，复用 Store 的公共契约，本文只写本包差异。

> 💡 中间件的组合方式、实例归属、销毁清理链与顺序等通用约定见仓库根 [README](../../README.md) 的「Store 中间件 · 通用契约」与「本地开发」。

## 特性与适用场景

| 🧭 场景                                | 是否适合 | 说明                                         |
| -------------------------------------- | -------- | -------------------------------------------- |
| 多标签共享主题、登录标记、草稿计数     | 适合     | 同名 `channel` 的实例互相同步后续变更        |
| 需要按字段裁剪发送内容                 | 适合     | `filter` 从更新后的完整状态选择数据字段      |
| 需要处理乱序/旧消息                    | 适合     | 可选 `timestamp` 或自定义 `ConflictResolver` |
| 无 `BroadcastChannel` 的环境（含 SSR） | 适合     | 降级为纯本地更新，不抛错                     |
| 需要新标签页自动获得已有状态           | 不适合   | 不同步初始状态，只同步之后的变更             |
| 状态含 action 函数                     | 需处理   | 结构化克隆不支持函数，需用 `filter` 剔除     |
| 需要跨设备、跨网络同步                 | 不适合   | 仅限同一来源的多个标签/上下文                |
| 需要强一致、无丢更新的合并             | 需谨慎   | 默认 `last-write-wins` 按到达顺序覆盖        |

## 安装

```sh
pnpm add @slux/store @slux/tab-sync
```

- **运行时依赖**（`dependencies`）：`@slux/store`、`@slux/shared`。
- **无 `peerDependencies`**：示例里直接 import 的 `@slux/store` 建议在应用侧显式声明。
- **宿主能力**：`BroadcastChannel` 由浏览器 / Worker / 部分 Node 环境提供，不是 npm 依赖；`crypto.randomUUID` 缺失时源码会回退到随机字符串生成 `senderId`。

## 快速开始

```ts
import { createStore } from "@slux/store";
import { broadcast } from "@slux/tab-sync";

type State = { theme: string; count: number; increment: () => void };

const store = createStore<State>(
  (set) => ({
    theme: "light",
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  {
    middleware: [
      broadcast<State>({
        channel: "app-state",
        // 只发送数据字段，action 函数无法通过结构化克隆
        filter: (state) => ({ theme: state.theme, count: state.count }),
      }),
    ],
  },
);

store.setState({ theme: "dark" });
```

## 核心 API

### `broadcast<T extends object>(options: BroadcastOptions<T>): Middleware<T>`

| 💡 选项              | 类型                                                      | 默认值              | 说明                                                   |
| -------------------- | --------------------------------------------------------- | ------------------- | ------------------------------------------------------ |
| `channel`            | `string`                                                  | 必填                | 通道名称；不同名称互相隔离                             |
| `filter`             | `(state: T) => Partial<T>`                                | 无                  | 从更新后的完整状态选择发送字段；只控制发送，不过滤接收 |
| `conflictResolution` | `"last-write-wins" \| "timestamp" \| ConflictResolver<T>` | `"last-write-wins"` | 远端消息的接受与合并策略                               |

传输格式为 `BroadcastMessage<T>`：`{ readonly senderId: string; readonly timestamp: number; readonly state: Partial<T> }`。`timestamp` 由 `Date.now()` 生成。

| 💡 冲突策略               | 行为                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `last-write-wins`（默认） | 按消息到达顺序应用，不比较 `timestamp`                                                   |
| `timestamp`               | 只接受严格晚于「最近一次已接受远端消息」时间戳的消息；初始阈值为 `0`，本地更新不推进该值 |
| `ConflictResolver<T>`     | `(incoming: Partial<T>, current: T) => Partial<T>`；返回值经完整中间件链应用             |

`timestamp` 依赖各端时钟，不能解决时钟偏差；自定义解析器可以读取本地当前状态后决定实际应用哪些字段。

## 专属语义与边界

⚠️ **`filter` 的取向**：无 `filter` 时发送的是本次 `onSet` 的 `partial`（部分状态）；提供 `filter` 时，源码对**更新后的完整状态** `api.getState()` 调用它，并用返回值作为 `state`。`filter` 只影响发送，接收端不做字段过滤。

**BroadcastChannel 依赖与降级**：`init` 时若 `typeof BroadcastChannel === "undefined"` 直接返回，不建立通道，本地写入照常执行（SSR 安全）。`crypto.randomUUID` 缺失时仍会生成不同的 `senderId`。

**结构化克隆限制**：`postMessage` 的数据必须支持结构化克隆。状态含 action 函数、Symbol、DOM 节点时，若未通过 `filter` 剔除，会由原生通道抛错（`DataCloneError`）；浏览器的构造/发送错误会正常抛出，本包不做静默重试。

**忽略自身与回传**：入口忽略 `senderId` 等于自身的消息；应用远端状态期间用 `applyingRemote` 守卫，避免把远端更新再次广播回去形成循环。守卫在 `finally` 中复位，因此业务订阅者抛错也不会让后续本地更新永久停止广播（但远端应用本身抛出的异常仍会向调用者传播）。

**消息校验**：入口检查 `senderId` 为字符串、`timestamp` 为有限数字、`state` 为非 `null` 非数组的普通对象；不满足的消息直接忽略，不做业务字段的运行时 schema 校验。

**不拉取初始状态**：新建标签页不会自动获得其他标签页的当前状态，只同步创建之后的写入。需要初始值时用 `@slux/storage` 恢复，或在业务层做一次握手。

**多标签冲突与顺序**：`last-write-wins` 下后到的消息覆盖先到的，即使其 `timestamp` 更小；`timestamp` 下早于或等于最近已接受远端时间戳的消息被丢弃；自定义解析器自行决定合并。并发写入没有全局仲裁。

**时间旅行**：撤销/重做经过完整中间件链，因此也会被广播；仓库中 history 包的 `__tests__/integration.test.ts` 含 `broadcast` 与 `history` 组合的用例。

**销毁**：`onDestroy` 把 `onmessage` 置空、`close()` 通道、复位时间戳阈值；`destroy()` 可重复调用。已经发出的消息无法撤回。

## 自动导入

🔌 `createAutoImportApis(prefix?)` 通过 `@slux/shared` 的 `generateBatchAutoImports` 生成 `unplugin-auto-import` 的 `ImportsMap`，来源名为 `@slux/tab-sync`。登记清单以 `src/auto-import-api.ts` 为准，只有 1 项：`broadcast`。

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/tab-sync";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

传入字符串前缀会为登记项生成带前缀别名（如 `createAutoImportApis("u")` 把 `broadcast` 映射为 `uBroadcast`）；前缀以小写字母结尾时 API 名首字母大写，否则直接拼接。`createAutoImportApis` 本身不登记。

## 类型导出

💡 `src/index.ts` 实际导出的类型：`BroadcastMessage<T>`、`BroadcastOptions<T>`、`ConflictResolution<T>`、`ConflictResolver<T>`。

本包不提供额外的控制器方法或替代 transport API；返回值就是 `@slux/store` 的 `Middleware<T>`，该类型由 `@slux/store` 定义，本包不重复导出。

## 不适用的场景

- 需要同步初始状态或全量快照：本包只广播后续变更。
- 运行环境没有 `BroadcastChannel` 且必须跨进程同步：会降级为纯本地更新。
- 需要跨设备、跨网络或服务端多实例同步：应使用后端通道。
- 需要强一致、无丢更新的合并：默认 `last-write-wins` 可能覆盖较新的写入，需自定义 `ConflictResolver`。
- payload 含函数、`Symbol` 等不可结构化克隆的值：需 `filter` 只选数据字段，否则原生通道抛错。
- 只需要单标签持久化：使用 `@slux/storage`。

## 版本、许可与反馈

| 项       | 值                                                        | 来源                                      |
| -------- | --------------------------------------------------------- | ----------------------------------------- |
| 版本     | `0.1.0`                                                   | `package.json`                            |
| 许可     | MIT                                                       | `package.json` / [LICENSE](../../LICENSE) |
| 问题反馈 | [GitHub Issues](https://github.com/itmanyong/slux/issues) | `package.json` `bugs`                     |

> 💡 `pnpm add` 基于 `package.json` 的发布配置；是否已实际发布到 npm 及线上版本号无法从源码确认。

<!-- package-navigation:start -->

## 包导航

### 核心层

响应式运行时与零依赖工具，其余各层都建立在 core 之上。

| 📦 包名                                                                       | 版本                                                                                                                                                                                                                                  | 在线文档                                                     | 功能                   |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------- |
| [`@slux/core`](https://github.com/itmanyong/slux/tree/main/packages/core)     | [![npm version](https://img.shields.io/npm/v/@slux/core)](https://www.npmjs.com/package/@slux/core) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/core?label=npmx)](https://npmx.dev/package/@slux/core)         | [在线文档](https://itmanyong.github.io/slux/packages/core)   | 框架无关的响应式运行时 |
| [`@slux/shared`](https://github.com/itmanyong/slux/tree/main/packages/shared) | [![npm version](https://img.shields.io/npm/v/@slux/shared)](https://www.npmjs.com/package/@slux/shared) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/shared?label=npmx)](https://npmx.dev/package/@slux/shared) | [在线文档](https://itmanyong.github.io/slux/packages/shared) | 零依赖的共享工具       |

### 范式层

六种组织状态的方式，共享 core 的运行时，可在同一个依赖图中混用。

| 📦 包名                                                                                     | 版本                                                                                                                                                                                                                                                              | 在线文档                                                            | 功能                               |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------- |
| [`@slux/store`](https://github.com/itmanyong/slux/tree/main/packages/store)                 | [![npm version](https://img.shields.io/npm/v/@slux/store)](https://www.npmjs.com/package/@slux/store) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/store?label=npmx)](https://npmx.dev/package/@slux/store)                                 | [在线文档](https://itmanyong.github.io/slux/packages/store)         | 状态与 action 集中管理，支持中间件 |
| [`@slux/atom`](https://github.com/itmanyong/slux/tree/main/packages/atom)                   | [![npm version](https://img.shields.io/npm/v/@slux/atom)](https://www.npmjs.com/package/@slux/atom) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/atom?label=npmx)](https://npmx.dev/package/@slux/atom)                                     | [在线文档](https://itmanyong.github.io/slux/packages/atom)          | 细粒度原子状态与派生               |
| [`@slux/proxy`](https://github.com/itmanyong/slux/tree/main/packages/proxy)                 | [![npm version](https://img.shields.io/npm/v/@slux/proxy)](https://www.npmjs.com/package/@slux/proxy) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/proxy?label=npmx)](https://npmx.dev/package/@slux/proxy)                                 | [在线文档](https://itmanyong.github.io/slux/packages/proxy)         | 可变代理写入与只读快照             |
| [`@slux/flux`](https://github.com/itmanyong/slux/tree/main/packages/flux)                   | [![npm version](https://img.shields.io/npm/v/@slux/flux)](https://www.npmjs.com/package/@slux/flux) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/flux?label=npmx)](https://npmx.dev/package/@slux/flux)                                     | [在线文档](https://itmanyong.github.io/slux/packages/flux)          | reducer + dispatch 范式            |
| [`@slux/state-machine`](https://github.com/itmanyong/slux/tree/main/packages/state-machine) | [![npm version](https://img.shields.io/npm/v/@slux/state-machine)](https://www.npmjs.com/package/@slux/state-machine) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/state-machine?label=npmx)](https://npmx.dev/package/@slux/state-machine) | [在线文档](https://itmanyong.github.io/slux/packages/state-machine) | 平面有限状态机                     |
| [`@slux/rxjs`](https://github.com/itmanyong/slux/tree/main/packages/rxjs)                   | [![npm version](https://img.shields.io/npm/v/@slux/rxjs)](https://www.npmjs.com/package/@slux/rxjs) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/rxjs?label=npmx)](https://npmx.dev/package/@slux/rxjs)                                     | [在线文档](https://itmanyong.github.io/slux/packages/rxjs)          | Observable 与状态双向桥接          |

### 中间件层

挂载到 Store 的横切能力，五个包共用同一套契约。

| 📦 包名                                                                             | 版本                                                                                                                                                                                                                                              | 在线文档                                                        | 功能                 |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------- |
| [`@slux/storage`](https://github.com/itmanyong/slux/tree/main/packages/storage)     | [![npm version](https://img.shields.io/npm/v/@slux/storage)](https://www.npmjs.com/package/@slux/storage) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/storage?label=npmx)](https://npmx.dev/package/@slux/storage)         | [在线文档](https://itmanyong.github.io/slux/packages/storage)   | 状态持久化与恢复     |
| [`@slux/history`](https://github.com/itmanyong/slux/tree/main/packages/history)     | [![npm version](https://img.shields.io/npm/v/@slux/history)](https://www.npmjs.com/package/@slux/history) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/history?label=npmx)](https://npmx.dev/package/@slux/history)         | [在线文档](https://itmanyong.github.io/slux/packages/history)   | 撤销与重做           |
| [`@slux/tab-sync`](https://github.com/itmanyong/slux/tree/main/packages/tab-sync)   | [![npm version](https://img.shields.io/npm/v/@slux/tab-sync)](https://www.npmjs.com/package/@slux/tab-sync) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/tab-sync?label=npmx)](https://npmx.dev/package/@slux/tab-sync)     | [在线文档](https://itmanyong.github.io/slux/packages/tab-sync)  | 跨标签页状态同步     |
| [`@slux/telemetry`](https://github.com/itmanyong/slux/tree/main/packages/telemetry) | [![npm version](https://img.shields.io/npm/v/@slux/telemetry)](https://www.npmjs.com/package/@slux/telemetry) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/telemetry?label=npmx)](https://npmx.dev/package/@slux/telemetry) | [在线文档](https://itmanyong.github.io/slux/packages/telemetry) | 状态变化与订阅遥测   |
| [`@slux/devtools`](https://github.com/itmanyong/slux/tree/main/packages/devtools)   | [![npm version](https://img.shields.io/npm/v/@slux/devtools)](https://www.npmjs.com/package/@slux/devtools) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/devtools?label=npmx)](https://npmx.dev/package/@slux/devtools)     | [在线文档](https://itmanyong.github.io/slux/packages/devtools)  | 调试工具、日志与检查 |

### 框架层

十二个绑定包都提供 core 主入口与六个范式子入口，使用框架原生响应式与生命周期。范式包是**可选** peer，只装实际使用的；`@slux/core` 与框架本身是**必需** peer。

| 📦 包名                                                                         | 版本                                                                                                                                                                                                                                      | 在线文档                                                      | 适配框架                                        | 适配版本                                   |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------ |
| [`@slux/react`](https://github.com/itmanyong/slux/tree/main/packages/react)     | [![npm version](https://img.shields.io/npm/v/@slux/react)](https://www.npmjs.com/package/@slux/react) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/react?label=npmx)](https://npmx.dev/package/@slux/react)         | [在线文档](https://itmanyong.github.io/slux/packages/react)   | [React](https://github.com/react/react)         | `^18.0.0 ‖ ^19.0.0`                        |
| [`@slux/vue`](https://github.com/itmanyong/slux/tree/main/packages/vue)         | [![npm version](https://img.shields.io/npm/v/@slux/vue)](https://www.npmjs.com/package/@slux/vue) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/vue?label=npmx)](https://npmx.dev/package/@slux/vue)                 | [在线文档](https://itmanyong.github.io/slux/packages/vue)     | [Vue](https://github.com/vuejs/core)            | `>= 3.2.0`                                 |
| [`@slux/solid`](https://github.com/itmanyong/slux/tree/main/packages/solid)     | [![npm version](https://img.shields.io/npm/v/@slux/solid)](https://www.npmjs.com/package/@slux/solid) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/solid?label=npmx)](https://npmx.dev/package/@slux/solid)         | [在线文档](https://itmanyong.github.io/slux/packages/solid)   | [Solid](https://github.com/solidjs/solid)       | `>= 1.0.0`                                 |
| [`@slux/svelte`](https://github.com/itmanyong/slux/tree/main/packages/svelte)   | [![npm version](https://img.shields.io/npm/v/@slux/svelte)](https://www.npmjs.com/package/@slux/svelte) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/svelte?label=npmx)](https://npmx.dev/package/@slux/svelte)     | [在线文档](https://itmanyong.github.io/slux/packages/svelte)  | [Svelte](https://github.com/sveltejs/svelte)    | `>= 4.0.0`                                 |
| [`@slux/angular`](https://github.com/itmanyong/slux/tree/main/packages/angular) | [![npm version](https://img.shields.io/npm/v/@slux/angular)](https://www.npmjs.com/package/@slux/angular) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/angular?label=npmx)](https://npmx.dev/package/@slux/angular) | [在线文档](https://itmanyong.github.io/slux/packages/angular) | [Angular](https://github.com/angular/angular)   | `@angular/core >= 16.0.0`、`rxjs >= 7.8.0` |
| [`@slux/preact`](https://github.com/itmanyong/slux/tree/main/packages/preact)   | [![npm version](https://img.shields.io/npm/v/@slux/preact)](https://www.npmjs.com/package/@slux/preact) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/preact?label=npmx)](https://npmx.dev/package/@slux/preact)     | [在线文档](https://itmanyong.github.io/slux/packages/preact)  | [Preact](https://github.com/preactjs/preact)    | `>= 10.5.0`                                |
| [`@slux/ripple`](https://github.com/itmanyong/slux/tree/main/packages/ripple)   | [![npm version](https://img.shields.io/npm/v/@slux/ripple)](https://www.npmjs.com/package/@slux/ripple) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/ripple?label=npmx)](https://npmx.dev/package/@slux/ripple)     | [在线文档](https://itmanyong.github.io/slux/packages/ripple)  | [Ripple](https://github.com/Ripple-TS/ripple)   | `>= 0.6.0`                                 |
| [`@slux/inferno`](https://github.com/itmanyong/slux/tree/main/packages/inferno) | [![npm version](https://img.shields.io/npm/v/@slux/inferno)](https://www.npmjs.com/package/@slux/inferno) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/inferno?label=npmx)](https://npmx.dev/package/@slux/inferno) | [在线文档](https://itmanyong.github.io/slux/packages/inferno) | [Inferno](https://github.com/infernojs/inferno) | `>= 7.0.0`                                 |
| [`@slux/octane`](https://github.com/itmanyong/slux/tree/main/packages/octane)   | [![npm version](https://img.shields.io/npm/v/@slux/octane)](https://www.npmjs.com/package/@slux/octane) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/octane?label=npmx)](https://npmx.dev/package/@slux/octane)     | [在线文档](https://itmanyong.github.io/slux/packages/octane)  | [Octane](https://github.com/octanejs/octane)    | `>= 0.16.0`                                |
| [`@slux/vitarx`](https://github.com/itmanyong/slux/tree/main/packages/vitarx)   | [![npm version](https://img.shields.io/npm/v/@slux/vitarx)](https://www.npmjs.com/package/@slux/vitarx) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/vitarx?label=npmx)](https://npmx.dev/package/@slux/vitarx)     | [在线文档](https://itmanyong.github.io/slux/packages/vitarx)  | [Vitarx](https://github.com/vitarx-lib/core)    | `>= 4.0.0`                                 |
| [`@slux/actview`](https://github.com/itmanyong/slux/tree/main/packages/actview) | [![npm version](https://img.shields.io/npm/v/@slux/actview)](https://www.npmjs.com/package/@slux/actview) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/actview?label=npmx)](https://npmx.dev/package/@slux/actview) | [在线文档](https://itmanyong.github.io/slux/packages/actview) | [ActView](https://github.com/actview/actview)   | `>= 1.0.0`                                 |
| [`@slux/viewfly`](https://github.com/itmanyong/slux/tree/main/packages/viewfly) | [![npm version](https://img.shields.io/npm/v/@slux/viewfly)](https://www.npmjs.com/package/@slux/viewfly) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/viewfly?label=npmx)](https://npmx.dev/package/@slux/viewfly) | [在线文档](https://itmanyong.github.io/slux/packages/viewfly) | [Viewfly](https://github.com/viewfly/viewfly)   | `>= 3.0.0`                                 |

格式差异：**Octane** 的公开入口是 TypeScript 源码，需消费端 Octane 编译器处理且不提供 CJS；**Ripple** 只发布 ESM，另有 `./server` 服务端入口。其余边界见各包文档。

### 插件层

**规划中**

| 包名 | 版本 | 在线文档 | 功能 |
| ---- | ---- | -------- | ---- |
| —    | —    | —        | —    |

<!-- package-navigation:end -->
