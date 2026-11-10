# @slux/telemetry

📊 为 `@slux/store` 记录初始化、状态变化、订阅三类事件的遥测中间件 `telemetry`。它把元数据交给调用方提供的回调，支持按字段过滤与运行时暂停；不发送网络请求、不克隆状态快照。它作为 `@slux/store` 中间件接入，复用 Store 的公共契约，本文只写本包差异。

[![GITHUB](https://img.shields.io/badge/GITHUB-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/itmanyong/slux/tree/main/packages/telemetry) [![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/@slux/telemetry) [![在线文档](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E6%96%87%E6%A1%A3-0F766E?style=for-the-badge)](https://itmanyong.github.io/slux/packages/telemetry/)

> 💡 中间件的组合方式、实例归属、销毁清理链与顺序等通用约定见仓库根 [README](../../README.md) 的「Store 中间件 · 通用契约」与「本地开发」。

## 特性与适用场景

| 🧭 场景                        | 是否适合 | 说明                                                         |
| ------------------------------ | -------- | ------------------------------------------------------------ |
| 统计每次更新耗时、累计更新次数 | 适合     | `StateChangeMetadata` 含 `durationMs` 与 `changeCount`       |
| 把指标接入监控/日志系统        | 适合     | 通过 `onStateChange` / `onInit` / `onSubscribe` 回调自行上报 |
| 按字段过滤或临时暂停上报       | 适合     | `filter` 与 `setEnabled(false)`                              |
| 需要隔离回调错误               | 适合     | 遥测回调异常交给 `onError`，不阻断状态更新                   |
| 需要精确的活跃订阅数           | 不适合   | `totalSubscriptions` 是累计订阅次数，不是当前活跃数          |
| 需要自动网络上报或落盘         | 不适合   | 本包不发请求、不持久化                                       |
| 需要状态快照的独立副本         | 需谨慎   | `prevState` / `nextState` 是引用，不做深拷贝                 |

## 安装

```sh
pnpm add @slux/store @slux/telemetry
```

- **运行时依赖**（`dependencies`）：`@slux/store`、`@slux/shared`。
- **无 `peerDependencies`**：示例里直接 import 的 `@slux/store` 建议在应用侧显式声明。
- **宿主能力**：耗时优先取 `performance.now()`，缺失时回退 `Date.now()`；`timestamp` 用 `new Date().toISOString()`。无浏览器专属 API 依赖，可用于 SSR。

## 快速开始

```ts
import { createStore } from "@slux/store";
import { telemetry } from "@slux/telemetry";

type State = { count: number };

const metrics = telemetry<State>({
  onStateChange: (meta) => console.log(meta.changeCount, meta.durationMs),
  onError: (context) => console.error(context.source, context.error),
});

const store = createStore<State>(() => ({ count: 0 }), { middleware: [metrics] });

store.setState({ count: 1 });
metrics.setEnabled(false); // 暂停上报，状态更新照常
```

## 核心 API

### `telemetry<T>(options: TelemetryOptions<T> = {}): TelemetryMiddleware<T>`

| 💡 选项         | 类型                                                           | 说明                       |
| --------------- | -------------------------------------------------------------- | -------------------------- |
| `onInit`        | `(initialState: T, metadata: InitMetadata) => void`            | `init` 时的初始状态事件    |
| `onStateChange` | `(metadata: StateChangeMetadata<T>) => void`                   | 每次状态更新事件           |
| `onSubscribe`   | `(metadata: SubscriptionMetadata) => void`                     | 每次注册订阅事件           |
| `onError`       | `(context: ErrorContext<T>) => void`                           | 接收遥测回调的错误与来源   |
| `filter`        | `(prevState: T, nextState: T, partial: Partial<T>) => boolean` | 返回 `true` 才上报状态变化 |

三类事件：

| 💡 事件  | 触发时机                          | 回调参数                                                                         |
| -------- | --------------------------------- | -------------------------------------------------------------------------------- |
| 初始化   | `init`                            | `onInit(api.getState(), { name, timestamp })`，`state` 即 creator 返回的初始状态 |
| 状态更新 | `onSet` 中 `next(partial)` 成功后 | `onStateChange(StateChangeMetadata<T>)`                                          |
| 订阅     | 每次 `subscribe` 注册             | `onSubscribe({ name, totalSubscriptions, timestamp })`                           |

元数据字段（均为只读）：

| 类型                     | 字段                                                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `StateChangeMetadata<T>` | `name`、`prevState`、`nextState`、`partial`、`timestamp`(ISO 字符串)、`durationMs`、`changeCount`                            |
| `InitMetadata`           | `name`、`timestamp`                                                                                                          |
| `SubscriptionMetadata`   | `name`、`totalSubscriptions`、`timestamp`                                                                                    |
| `ErrorContext<T>`        | `error`、`source`（`"onStateChange" \| "onInit" \| "onSubscribe" \| "filter"`）、`state`（`onSubscribe` 错误为 `undefined`） |

控制器方法：`setEnabled(enabled: boolean): void` 与 `isEnabled(): boolean`。实例默认启用；`name` 固定为 `"telemetry"`。

## 专属语义与边界

⚠️ **生成时机**：`onSet` 先记录 `prevState`、调用 `next(partial)` 让下游中间件执行，再读取 `nextState`，因此 `nextState` 能看到下游改写后的状态。`durationMs` 覆盖下游更新与 `filter` 执行，不包含上报回调自身。

**计时**：优先使用 `performance.now()`，缺失时回退 `Date.now()`；元数据里的 `timestamp` 是 `toISOString()` 字符串，不是毫秒时间戳。

**过滤与暂停**：`filter` 返回 `false` 则不上报；`setEnabled(false)` 时跳过 `onInit` / `onSubscribe` / `onStateChange` / `filter` 全部回调。两者都**不阻断状态更新**，且 `changeCount` 在暂停与被过滤期间仍累计（它统计的是包含这些情形在内的更新次数）。未配置 `onStateChange` 时不会调用 `filter`。

**订阅计数**：`totalSubscriptions` 是累计订阅次数，包含已取消的订阅（Store 没有取消订阅钩子），暂停期间注册也照常累计。`onSubscribe` 返回原 `listener`，不包装监听逻辑。

**错误隔离**：`onInit` / `onStateChange` / `onSubscribe` / `filter` 抛错时交给 `onError`，并用 `source` 标识来源；`onError` 自身抛错会被吞掉。业务中间件或订阅者抛出的异常仍向调用者传播，不会被包装成遥测错误。

**销毁**：`onDestroy` 把 `changeCount` 与 `totalSubscriptions` 归零，因此同一个中间件实例接入新 Store 时计数从 1 重新开始。销毁前的元数据不会被自动上报。

**快照与异步**：本包不克隆 `prevState` / `nextState`，二者是引用；只拦截每次同步 `setState` 写入，异步 action 在 `await` 后写入同样形成一次更新事件。不发网络请求、不落盘。

## 自动导入

🔌 `createAutoImportApis(prefix?)` 通过 `@slux/shared` 的 `generateBatchAutoImports` 生成 `unplugin-auto-import` 的 `ImportsMap`，来源名为 `@slux/telemetry`。登记清单以 `src/auto-import-api.ts` 为准，只有 1 项：`telemetry`。

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/telemetry";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

传入字符串前缀会为登记项生成带前缀别名（如 `createAutoImportApis("u")` 把 `telemetry` 映射为 `uTelemetry`）；前缀以小写字母结尾时 API 名首字母大写，否则直接拼接。`createAutoImportApis` 本身不登记。

## 类型导出

💡 `src/index.ts` 实际导出的类型：`ErrorContext<T>`、`InitMetadata`、`StateChangeMetadata<T>`、`SubscriptionMetadata`、`TelemetryMiddleware<T>`、`TelemetryOptions<T>`。

`TelemetryMiddleware<T>` 含 `name`、`init`、`onSet`、`onSubscribe`、`onDestroy` 以及 `setEnabled` / `isEnabled`；其结构满足 `@slux/store` 的 `Middleware<T>`，后者由 `@slux/store` 定义，本包不重复导出。

## 不适用的场景

- 需要精确的当前活跃订阅数：`totalSubscriptions` 是累计次数。
- 需要自动把指标发到远端或持久化：本包只调用回调，需自行上报。
- 需要状态快照的独立副本或序列化：本包不克隆，`prevState` / `nextState` 为引用。
- 需要精确的性能剖析或跨异步任务计时：`durationMs` 只覆盖同步 `onSet` 链与 `filter`。
- 需要撤销重做、持久化或跨标签同步：分别使用 `@slux/history`、`@slux/storage`、`@slux/tab-sync`。

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
