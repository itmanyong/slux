# @slux/devtools

为 `@slux/store` 提供三组调试能力：`devtools` 连接 Redux DevTools 扩展、`logger` 输出控制台日志、`inspect` 注册模块级自定义检查器。前两者是 Store 中间件，第三者是全局回调注册器。中间件类型只在类型层复用 Store 的公共契约，本包运行时不导入 `@slux/store`。本文只写本包差异。

> 中间件的组合方式、实例归属、销毁清理链与顺序等通用约定见仓库根 [README](../../README.md) 的「Store 中间件 · 通用契约」与「本地开发」。

## 特性与适用场景

| 场景                               | 是否适合 | 用哪个                                                      |
| ---------------------------------- | -------- | ----------------------------------------------------------- |
| 开发期时间旅行、状态跳转与回放     | 适合     | `devtools` + Redux DevTools 扩展                            |
| 控制台查看每次更新前后状态与差异   | 适合     | `logger`                                                    |
| 把生命周期事件接入自定义面板或测试 | 适合     | `inspect`                                                   |
| 未安装扩展或 SSR                   | 适合     | `devtools` 不连接扩展，但检查器仍收到完整生命周期事件       |
| 生产环境                           | 需处理   | 给 `devtools` / `logger` 传 `enabled: false`                |
| 需要持久化、跨标签同步、撤销重做   | 不适合   | 分别使用 `@slux/storage`、`@slux/tab-sync`、`@slux/history` |

## 安装

```sh
pnpm add @slux/store @slux/devtools
```

- **运行时依赖**（`dependencies`）：`@slux/store`、`@slux/shared`。
- **无 `peerDependencies`**：示例里直接 import 的 `@slux/store` 建议在应用侧显式声明。
- **宿主能力**：`__REDUX_DEVTOOLS_EXTENSION__` 与 `console` 由浏览器/调试宿主提供，不是 npm 依赖。

## 不在运行时导入 Store

源码中 `devtools.ts`、`logger.ts`、`types.ts` 只用 `import type { Middleware, MiddlewareAPI, SetFn } from "@slux/store"` 引用类型；`types.ts` 还 `export type { MiddlewareAPI, SetFn } from "@slux/store"` 供包内复用。整个包没有对 `@slux/store` 的运行时 value import，因此加载本包不会连带加载 Store。但使用方仍需安装 `@slux/store`（`createStore` 来自它，且它是本包 `dependencies`）；返回的中间件对象结构满足 `Middleware<T>`，可直接放进 `options.middleware`。

## 快速开始

```ts
import { createStore } from "@slux/store";
import { devtools, inspect, logger } from "@slux/devtools";

type Counter = { count: number; increment: () => void };

const stop = inspect((event) => {
  console.log(event.storeName, event.type, event.state);
});

const store = createStore<Counter>(
  (set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  {
    middleware: [devtools<Counter>({ name: "Counter" }), logger<Counter>({ name: "Counter", diff: true })],
  },
);

store.getState().increment();
stop();
store.destroy();
```

## 核心 API

### `devtools<T>(options?: DevtoolsOptions): DevtoolsMiddleware<T>`

| 选项         | 默认值         | 说明                                                            |
| ------------ | -------------- | --------------------------------------------------------------- |
| `name`       | `"Slux Store"` | 扩展连接名与检查器事件里的 `storeName`                          |
| `enabled`    | `true`         | 设为 `false` 时返回纯透传中间件：不连扩展、不订阅、不发检查事件 |
| `actionName` | 自动推导       | 从 `Record<string, unknown>` 形式的部分更新返回动作名           |

**连接与动作名**：`init` 时从 `globalThis.__REDUX_DEVTOOLS_EXTENSION__` 取扩展（须是对象且 `connect` 为函数），调用 `connect({ name })`、`init(当前状态)` 并订阅扩展消息；订阅返回值兼容「取消函数」与 `{ unsubscribe() }` 两种形式。动作名由 `deriveActionName` 推导：部分更新的键排序后为 `set:key1,key2`（如 `set:count,name`），空更新为 `setState`。每次普通更新通过 `connection.send({ type: action }, state)` 上报。

**扩展消息**：只处理 `type === "DISPATCH"` 且 `payload` 为对象的消息。

| `payload.type`                     | 行为                                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `JUMP_TO_STATE` / `JUMP_TO_ACTION` | 解析 `message.state` 或 `payload.state`（JSON 字符串）后应用                                             |
| `ROLLBACK`                         | 应用后调用 `connection.init(api.getState())`                                                             |
| `RESET`                            | 应用 `getInitialState()` 后调用 `connection.init`                                                        |
| `COMMIT`                           | 以当前状态 `connection.init`                                                                             |
| `IMPORT_STATE`                     | 取 `nextLiftedState.computedStates` 最后一项应用，并把完整历史 `connection.send(null, history)` 回传扩展 |

**时间旅行还原**：`applyState` 只还原数据——把当前状态里所有函数类型字段保留到 `partial`，避免序列化历史替换掉 Store 的 action；再经 Store 浅合并，历史未包含的字段仍保留。转移期间用 `isTimeTraveling` 守卫，不发送普通动作、也不发 `SET` 检查事件，防止重复记录。非法 JSON、非对象状态、非 `DISPATCH` 消息、不完整 payload 一律忽略。

### `logger<T>(options?: LoggerOptions): LoggerMiddleware<T>`

| 选项         | 默认值    | 说明                                        |
| ------------ | --------- | ------------------------------------------- |
| `name`       | `"Slux"`  | 日志分组名                                  |
| `collapsed`  | `true`    | 使用 `groupCollapsed`（`false` 用 `group`） |
| `diff`       | `false`   | 追加输出顶层字段的浅比较差异                |
| `enabled`    | `true`    | `false` 时纯透传，不输出、不计算差异        |
| `logger`     | `console` | 实现 `LoggerInterface` 的自定义日志器       |
| `actionName` | 自动推导  | 自定义动作名                                |

每次更新输出 `▸ {name} @ HH:MM:SS.mmm {action}` 分组，内含 `prev state`、`action`、`next state`，开启 `diff` 时追加 `diff`（顶层字段的 `{ prev, next }` 比较，包含新增键）。`LoggerInterface` 需要 `log`、`group`、`groupCollapsed`、`groupEnd` 四个方法。`LoggerMiddleware<T>` 只有 `name` 与 `onSet` 两个成员，没有 `init` / `onDestroy`。

### `inspect(callback: InspectCallback): () => void`

| API                 | 说明                                                           |
| ------------------- | -------------------------------------------------------------- |
| `inspect(callback)` | 注册模块级检查器，返回幂等的取消函数（可重复调用）             |
| `clearInspectors()` | 清空全部检查器，主要用于测试隔离                               |
| `InspectEventType`  | 运行时常量：`{ SET: "set", INIT: "init", DESTROY: "destroy" }` |

`InspectEvent` 含 `type`、`storeName`、`state`、`timestamp`（`Date.now()` 毫秒数字）；`set` 事件另有 `action` 与 `prevState`。事件由 `devtools` 中间件发出：初始化发 `INIT`、每次普通更新发 `SET`、销毁发 `DESTROY`；时间旅行期间不发 `SET`；`enabled: false` 的 `devtools` 完全不发事件。

检查器是**模块级全局**，会收到所有启用了 `devtools` 的 Store 的事件，按注册顺序同步执行；单个回调抛错被隔离，不影响 Store 更新与其他检查器。

## 专属语义与边界

**扩展缺失与 SSR 降级**：`getExtension()` 在 `globalThis` 上没有 `__REDUX_DEVTOOLS_EXTENSION__` 或其 `connect` 不是函数时返回 `undefined`；此时 `init` 不建立连接、不订阅，但**仍发出 `INIT` / `SET` / `DESTROY` 检查器事件**，本地状态更新照常，`window` 未定义的 SSR 同样安全。这与 `enabled: false`（完全静默透传）是两种不同的降级。

**`enabled: false`**：`devtools` 返回字面量透传中间件，`logger` 在 `onSet` 中只调用 `next(partial)`；两者都不连接扩展、不发检查事件、不计算日志差异。

**开发环境启用**：把布尔开关交给调用方决定，例如：

```ts
// 沿用上文的 Counter 类型
const debugEnabled = true; // 由应用注入，例如读取构建环境的布尔标志
const dt = devtools<Counter>({ enabled: debugEnabled });
const lg = logger<Counter>({ enabled: debugEnabled });
```

**销毁**：`devtools` 的 `onDestroy` 先断开扩展订阅（`disconnect?.()`）、清空 `api` / `connection`，再在 `finally` 中发出 `DESTROY` 事件；销毁后已排队的扩展回调因 `api` 为 `undefined` 被忽略，不会再操作连接或状态。`logger` 无销毁钩子；`inspect` 的取消函数需由调用方自行调用。

**异步与错误**：`logger` 与 `devtools` 只拦截同步 `onSet` 链；异步 action 在 `await` 后写入同样形成一次更新与一条检查事件。扩展消息的解析失败被静默忽略；检查器回调抛错被隔离；`devtools` 不克隆状态快照。

## 自动导入

`createAutoImportApis(prefix?)` 通过 `@slux/shared` 的 `generateBatchAutoImports` 生成 `unplugin-auto-import` 的 `ImportsMap`，来源名为 `@slux/devtools`。登记清单以 `src/auto-import-api.ts` 为准，共 5 项：

`InspectEventType`、`clearInspectors`、`devtools`、`inspect`、`logger`

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/devtools";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

传入字符串前缀会为登记项生成带前缀别名（如 `createAutoImportApis("u")` 把 `devtools` 映射为 `uDevtools`）；前缀以小写字母结尾时 API 名首字母大写，否则直接拼接。`createAutoImportApis` 本身不登记，`emitInspectEvent` 是内部函数、不在公开导出中。

## 类型导出

`src/index.ts` 实际 `export type` 的类型：`DevtoolsOptions`、`DevtoolsMiddleware<T>`、`LoggerOptions`、`LoggerMiddleware<T>`、`LoggerInterface`、`InspectEvent`、`InspectCallback`、`InspectEventTypeValue`。

运行时导出为 `devtools`、`logger`、`inspect`、`clearInspectors`、`InspectEventType`、`createAutoImportApis`。`types.ts` 里还定义了 `DevtoolsMessage`、`DevtoolsConnection`、`ReduxDevtoolsExtension` 以及重导出的 `MiddlewareAPI` / `SetFn`，但它们**没有**从 `src/index.ts` 导出，不属于公开 API 面。

## 不适用的场景

- 生产环境默认开启：建议显式传 `enabled: false`。
- 期望中间件自行持久化、跨标签同步或撤销重做：分别使用 `@slux/storage`、`@slux/tab-sync`、`@slux/history`。
- 期望 `inspect` 接收任意事件源：它只接收 `devtools` 中间件发出的生命周期事件。
- 期望无扩展时也有时间旅行 UI：无扩展只降级为本地更新 + 检查器事件，不做状态回放。
- 需要把结构化日志写到远端：需提供自定义 `LoggerInterface`。

## 版本、许可与反馈

| 项       | 值                                         | 来源                                      |
| -------- | ------------------------------------------ | ----------------------------------------- |
| 版本     | `0.1.0`                                    | `package.json`                            |
| 许可     | MIT                                        | `package.json` / [LICENSE](../../LICENSE) |
| 问题反馈 | `https://github.com/itmanyong/slux/issues` | `package.json` `bugs`                     |

> `pnpm add` 基于 `package.json` 的发布配置；是否已实际发布到 npm 及线上版本号无法从源码确认。
