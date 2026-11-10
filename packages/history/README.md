# @slux/history

为 `@slux/store` 提供基于状态快照的撤销与重做中间件 `history`。它在每次写入前把当前状态压入 `past` 栈，撤销/重做通过完整中间件链恢复，并额外暴露 `canUndo` / `canRedo` 两个只读响应式信号。它作为 `@slux/store` 中间件接入，复用 Store 的公共契约，本文只写本包差异。

> 中间件的组合方式、实例归属、销毁清理链与顺序等通用约定见仓库根 [README](../../README.md) 的「Store 中间件 · 通用契约」与「本地开发」。

## 特性与适用场景

| 场景                                          | 是否适合 | 说明                                                                                       |
| --------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| 编辑器、表单、画布需要撤销/重做               | 适合     | 线性 `past` / `future` 双栈，`undo()` / `redo()`                                           |
| 把按钮可用状态绑到 UI                         | 适合     | `canUndo` / `canRedo` 是 `ReadonlySignal<boolean>`，可用于 `computed`、`effect` 与框架适配 |
| 撤销需要同步持久化、通知 DevTools、跨标签同步 | 适合     | 恢复经过完整中间件链                                                                       |
| 状态字段结构固定、以基础类型为主              | 适合     | 快照按引用保存，恢复走 Store 浅合并                                                        |
| 状态含嵌套可变对象且需要隔离历史              | 不适合   | 快照不做深拷贝，直接修改嵌套对象会污染历史                                                 |
| 状态字段会随版本增减、需要删除旧字段          | 需谨慎   | 浅合并不删除旧快照中不存在的字段                                                           |
| 需要历史列表、时间旅行 UI                     | 不适合   | 本包只提供线性撤销/重做，不暴露快照列表                                                    |

## 安装

```sh
pnpm add @slux/store @slux/history
```

- **运行时依赖**（`dependencies`）：`@slux/core`、`@slux/store`、`@slux/shared`。`canUndo` / `canRedo` 基于 `@slux/core` 的 `signal`，因此它是运行时依赖而非 peer。
- **无 `peerDependencies`**：`devDependencies` 中的 `@slux/devtools`、`@slux/storage`、`@slux/tab-sync`、`@slux/telemetry` 仅用于组合场景的集成测试。
- **无浏览器 API 依赖**：可在 Node / SSR 环境使用。

## 快速开始

```ts
import { createStore } from "@slux/store";
import { history } from "@slux/history";

type Counter = { count: number; increment: () => void };

const h = history<Counter>({ maxDepth: 100 });
const store = createStore<Counter>(
  (set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  { middleware: [h] },
);

store.getState().increment(); // count: 1
h.undo(); // count: 0
h.redo(); // count: 1
h.canUndo.get(); // true
store.destroy();
```

## 核心 API

### `history<T>(options?: HistoryOptions): HistoryMiddleware<T>`

| 配置       | 类型     | 默认值 | 说明                                                         |
| ---------- | -------- | ------ | ------------------------------------------------------------ |
| `maxDepth` | `number` | `100`  | 最多保存的撤销快照数；超出时丢弃最早快照，`0` 表示不记录历史 |

`HistoryMiddleware<T>` 在满足 `@slux/store` 的 `Middleware<T>`（`name`、`init`、`onSet`、`onDestroy`）之外，提供以下成员：

| 成员      | 类型 / 签名               | 说明                                 |
| --------- | ------------------------- | ------------------------------------ |
| `undo`    | `() => void`              | 恢复上一个快照；无快照时不做操作     |
| `redo`    | `() => void`              | 恢复下一个快照；无快照时不做操作     |
| `clear`   | `() => void`              | 清空 `past` / `future`，当前状态不变 |
| `canUndo` | `ReadonlySignal<boolean>` | 是否可撤销；只读，不能从外部 `set`   |
| `canRedo` | `ReadonlySignal<boolean>` | 是否可重做；只读                     |

`canUndo` 与 `canRedo` 由 `@slux/core` 的 `signal` 实现，并在一次 `batch` 中同时更新，可直接放进 `computed` / `effect`，也可由框架适配包读取。

## 专属语义与边界

**快照与浅合并**：每次 `onSet` 记录的是 `next` 之前的 `api.getState()` 引用，不做深拷贝，函数与未变化对象保留原引用。恢复调用 `setState(() => previous)`，走 Store 的浅合并：旧快照里的字段覆盖当前值，而**旧快照中不存在的字段仍保留**（例如后续新增字段不会被删除）。因此适用于字段结构固定的状态。

**撤销/重做经过完整中间件链**：`undo` / `redo` 不是直接改内部状态，而是通过 API 的 `setState` 重新进入完整写入链，所以会同步触发持久化、DevTools、遥测与跨标签同步。实现用 `traveling` 守卫，恢复动作不会被再次记成一条历史。多个中间件组合下的同步持久化与上报行为，在 `__tests__/integration.test.ts` 中有对应用例。

**重做栈清空**：撤销后如果发生新的写入，`future` 会被清空，形成新的分支。

**`maxDepth`**：`past` 超过上限时从头部丢弃最早快照；`maxDepth: 0` 不记录任何历史，action 仍可正常调用。

**被阻断或抛错的写入**：若后续中间件阻断写入（`getState()` 引用未变化），该次记录会被移除，不产生可撤销项；写入前抛出的异常不会被本包吞掉，`future` 也不会被清空；某次撤销被阻断后对应快照仍保留，可再次尝试。

**通知中的 `clear` / `destroy`**：转移结束时检查状态是否真的改变，通知回调里调用 `clear()` 或 `destroy()` 会取消这次转移，不会误生成重做记录。

**初始化与销毁边界**：未 `init`（`api` 未设置）时 `undo` / `redo` / `clear` 都是 no-op，不会抛错；`destroy()` 会清空两侧历史并置 `api` 为 `undefined`，之后调用同样安全。

**异步与 SSR**：只拦截每次同步 `setState` 写入；异步 action 在 `await` 后写入同样会形成一条历史记录。本包不依赖浏览器 API，可用于 SSR，但不提供跨请求的状态隔离，也不持久化历史栈。

## 自动导入

`createAutoImportApis(prefix?)` 通过 `@slux/shared` 的 `generateBatchAutoImports` 生成 `unplugin-auto-import` 的 `ImportsMap`，来源名为 `@slux/history`。登记清单以 `src/auto-import-api.ts` 为准，只有 1 项：`history`。

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/history";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

传入字符串前缀会为登记项生成带前缀别名（如 `createAutoImportApis("u")` 把 `history` 映射为 `uHistory`）；前缀以小写字母结尾时 API 名首字母大写，否则直接拼接。`createAutoImportApis` 本身不登记。

## 类型导出

`src/index.ts` 实际导出的类型：

| 类型                   | 用途                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `HistoryOptions`       | `{ readonly maxDepth?: number }`                                                                                          |
| `HistoryMiddleware<T>` | `history()` 的返回类型；结构满足 `@slux/store` 的 `Middleware<T>`，并含 `undo` / `redo` / `clear` / `canUndo` / `canRedo` |
| `MiddlewareAPI<T>`     | 从 `@slux/store` 直接重导出                                                                                               |
| `SetFn<T>`             | 从 `@slux/store` 直接重导出                                                                                               |

`canUndo` / `canRedo` 的具体类型是 `@slux/core` 的 `ReadonlySignal<boolean>`，本包不重复导出该类型。

## 不适用的场景

- 需要深拷贝或隔离嵌套可变对象：快照按引用保存，直接修改 `getState()` 返回的嵌套对象不会触发通知，也可能污染历史。
- 状态结构频繁变化且要求删除旧字段：恢复是浅合并，旧快照没有的字段不会被删除。
- 需要历史快照列表、跳转面板或时间旅行 UI：本包只提供线性 `undo` / `redo`，需要自行扩展或使用 `@slux/devtools`。
- 需要把历史栈持久化或跨设备同步：本包不持久化历史；状态持久化用 `@slux/storage`，跨标签同步用 `@slux/tab-sync`。
- 需要基于时间戳或字段级的合并策略：本包以「整对象快照」为单位。

## 版本、许可与反馈

| 项       | 值                                         | 来源                                      |
| -------- | ------------------------------------------ | ----------------------------------------- |
| 版本     | `0.1.0`                                    | `package.json`                            |
| 许可     | MIT                                        | `package.json` / [LICENSE](../../LICENSE) |
| 问题反馈 | `https://github.com/itmanyong/slux/issues` | `package.json` `bugs`                     |

> `pnpm add` 基于 `package.json` 的发布配置；是否已实际发布到 npm 及线上版本号无法从源码确认。
