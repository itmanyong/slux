# @slux/telemetry

为 `@slux/store` 记录初始化、状态变化、订阅三类事件的遥测中间件 `telemetry`。它把元数据交给调用方提供的回调，支持按字段过滤与运行时暂停；不发送网络请求、不克隆状态快照。它作为 `@slux/store` 中间件接入，复用 Store 的公共契约，本文只写本包差异。

> 中间件的组合方式、实例归属、销毁清理链与顺序等通用约定见仓库根 [README](../../README.md) 的「Store 中间件 · 通用契约」与「本地开发」。

## 特性与适用场景

| 场景                           | 是否适合 | 说明                                                         |
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

| 选项            | 类型                                                           | 说明                       |
| --------------- | -------------------------------------------------------------- | -------------------------- |
| `onInit`        | `(initialState: T, metadata: InitMetadata) => void`            | `init` 时的初始状态事件    |
| `onStateChange` | `(metadata: StateChangeMetadata<T>) => void`                   | 每次状态更新事件           |
| `onSubscribe`   | `(metadata: SubscriptionMetadata) => void`                     | 每次注册订阅事件           |
| `onError`       | `(context: ErrorContext<T>) => void`                           | 接收遥测回调的错误与来源   |
| `filter`        | `(prevState: T, nextState: T, partial: Partial<T>) => boolean` | 返回 `true` 才上报状态变化 |

三类事件：

| 事件     | 触发时机                          | 回调参数                                                                         |
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

**生成时机**：`onSet` 先记录 `prevState`、调用 `next(partial)` 让下游中间件执行，再读取 `nextState`，因此 `nextState` 能看到下游改写后的状态。`durationMs` 覆盖下游更新与 `filter` 执行，不包含上报回调自身。

**计时**：优先使用 `performance.now()`，缺失时回退 `Date.now()`；元数据里的 `timestamp` 是 `toISOString()` 字符串，不是毫秒时间戳。

**过滤与暂停**：`filter` 返回 `false` 则不上报；`setEnabled(false)` 时跳过 `onInit` / `onSubscribe` / `onStateChange` / `filter` 全部回调。两者都**不阻断状态更新**，且 `changeCount` 在暂停与被过滤期间仍累计（它统计的是包含这些情形在内的更新次数）。未配置 `onStateChange` 时不会调用 `filter`。

**订阅计数**：`totalSubscriptions` 是累计订阅次数，包含已取消的订阅（Store 没有取消订阅钩子），暂停期间注册也照常累计。`onSubscribe` 返回原 `listener`，不包装监听逻辑。

**错误隔离**：`onInit` / `onStateChange` / `onSubscribe` / `filter` 抛错时交给 `onError`，并用 `source` 标识来源；`onError` 自身抛错会被吞掉。业务中间件或订阅者抛出的异常仍向调用者传播，不会被包装成遥测错误。

**销毁**：`onDestroy` 把 `changeCount` 与 `totalSubscriptions` 归零，因此同一个中间件实例接入新 Store 时计数从 1 重新开始。销毁前的元数据不会被自动上报。

**快照与异步**：本包不克隆 `prevState` / `nextState`，二者是引用；只拦截每次同步 `setState` 写入，异步 action 在 `await` 后写入同样形成一次更新事件。不发网络请求、不落盘。

## 自动导入

`createAutoImportApis(prefix?)` 通过 `@slux/shared` 的 `generateBatchAutoImports` 生成 `unplugin-auto-import` 的 `ImportsMap`，来源名为 `@slux/telemetry`。登记清单以 `src/auto-import-api.ts` 为准，只有 1 项：`telemetry`。

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/telemetry";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

传入字符串前缀会为登记项生成带前缀别名（如 `createAutoImportApis("u")` 把 `telemetry` 映射为 `uTelemetry`）；前缀以小写字母结尾时 API 名首字母大写，否则直接拼接。`createAutoImportApis` 本身不登记。

## 类型导出

`src/index.ts` 实际导出的类型：`ErrorContext<T>`、`InitMetadata`、`StateChangeMetadata<T>`、`SubscriptionMetadata`、`TelemetryMiddleware<T>`、`TelemetryOptions<T>`。

`TelemetryMiddleware<T>` 含 `name`、`init`、`onSet`、`onSubscribe`、`onDestroy` 以及 `setEnabled` / `isEnabled`；其结构满足 `@slux/store` 的 `Middleware<T>`，后者由 `@slux/store` 定义，本包不重复导出。

## 不适用的场景

- 需要精确的当前活跃订阅数：`totalSubscriptions` 是累计次数。
- 需要自动把指标发到远端或持久化：本包只调用回调，需自行上报。
- 需要状态快照的独立副本或序列化：本包不克隆，`prevState` / `nextState` 为引用。
- 需要精确的性能剖析或跨异步任务计时：`durationMs` 只覆盖同步 `onSet` 链与 `filter`。
- 需要撤销重做、持久化或跨标签同步：分别使用 `@slux/history`、`@slux/storage`、`@slux/tab-sync`。

## 版本、许可与反馈

| 项       | 值                                         | 来源                                      |
| -------- | ------------------------------------------ | ----------------------------------------- |
| 版本     | `0.1.0`                                    | `package.json`                            |
| 许可     | MIT                                        | `package.json` / [LICENSE](../../LICENSE) |
| 问题反馈 | `https://github.com/itmanyong/slux/issues` | `package.json` `bugs`                     |

> `pnpm add` 基于 `package.json` 的发布配置；是否已实际发布到 npm 及线上版本号无法从源码确认。
