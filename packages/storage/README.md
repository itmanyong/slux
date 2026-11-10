# @slux/storage

为 `@slux/store` 提供持久化中间件 `persist`：把状态写入可插拔后端，并在创建 Store 时恢复。同步与异步后端统一处理，支持字段裁剪、版本迁移、合并策略与错误观察。它作为 `@slux/store` 中间件接入，复用 Store 的公共契约，本文只写本包差异。

> 中间件的组合方式、实例归属、销毁清理链与顺序等通用约定见仓库根 [README](../../README.md) 的「Store 中间件 · 通用契约」与「本地开发」。

## 特性与适用场景

| 场景                                     | 是否适合 | 说明                                                   |
| ---------------------------------------- | -------- | ------------------------------------------------------ |
| 刷新后恢复 UI 偏好、草稿、计数器         | 适合     | 创建 Store 时自动 hydration，写入后自动保存            |
| 需要可替换的存储介质                     | 适合     | 内置 5 个后端，也可传入自定义 `StorageAdapter`         |
| 需要版本升级后的旧数据迁移               | 适合     | `version` + `migrate`，支持同步与异步迁移              |
| 状态含 action 函数或不可 JSON 序列化的值 | 需处理   | 用 `partialize` 剔除，否则默认 `JSON.stringify` 会报错 |
| 只需要内存态、无持久化需求               | 不适合   | 直接用 `createStore` 即可                              |
| 需要跨标签实时同步                       | 不适合   | 使用 `@slux/tab-sync`                                  |
| 需要撤销重做                             | 不适合   | 使用 `@slux/history`                                   |

## 安装

```sh
pnpm add @slux/store @slux/storage
```

- **运行时依赖**（`dependencies`）：`@slux/store`、`@slux/shared`。
- **无 `peerDependencies`**：`@slux/core` 只是本包的开发依赖；示例里直接 import 的 `@slux/store` 建议在应用侧显式声明。
- **宿主能力**：`localStorage`、`sessionStorage`、`document.cookie`、`indexedDB` 由运行环境提供，不是 npm 依赖；缺失时按「专属语义与边界」降级。

## 快速开始

```ts
import { createStore } from "@slux/store";
import { localStorageBackend, persist } from "@slux/storage";

type Prefs = { theme: string; count: number };

const persistence = persist<Prefs>({
  key: "prefs",
  storage: localStorageBackend(),
  partialize: ({ theme }) => ({ theme }),
});

const store = createStore<Prefs>(() => ({ theme: "light", count: 0 }), {
  middleware: [persistence],
});

store.setState({ theme: "dark" }); // 提交后写入 localStorage，只保存 theme
```

## 核心 API

### `persist<T>(options: PersistOptions<T>): PersistMiddleware<T>`

| 配置            | 类型                                                        | 默认值                       | 说明                                     |
| --------------- | ----------------------------------------------------------- | ---------------------------- | ---------------------------------------- |
| `key`           | `string`                                                    | 必填                         | 存储键                                   |
| `storage`       | `StorageAdapter`                                            | `memoryStorage()`            | 同步或异步后端                           |
| `partialize`    | `(state: T) => Partial<T>`                                  | 全部状态                     | 选择要保存的字段                         |
| `merge`         | `(persisted: Partial<T>, current: T) => T`                  | `(p, c) => ({ ...c, ...p })` | 恢复时的合并策略，持久化字段覆盖当前字段 |
| `version`       | `number`                                                    | `0`                          | 写入 envelope 的当前数据版本             |
| `migrate`       | `(persisted, version) => Partial<T> \| Promise<Partial<T>>` | 无                           | 版本不同时迁移；未提供则忽略旧数据       |
| `serialize`     | `(envelope: PersistEnvelope<Partial<T>>) => string`         | `JSON.stringify`             | 序列化 `{ state, version }`              |
| `deserialize`   | `(raw: string) => PersistEnvelope<Partial<T>>`              | `JSON.parse`                 | 反序列化；业务字段结构可在此校验         |
| `onError`       | `(error: PersistError) => void`                             | 忽略                         | 接收错误码、描述与原始原因               |
| `skipHydration` | `boolean`                                                   | `false`                      | 跳过 `init` 时的自动恢复，适合 SSR       |

`PersistMiddleware<T>` 在满足 `@slux/store` 的 `Middleware<T>`（`name`、`init`、`onSet`、`onDestroy`）之外，还提供一组控制器方法：

| 方法           | 签名                                           | 说明                                                                 |
| -------------- | ---------------------------------------------- | -------------------------------------------------------------------- |
| `rehydrate`    | `() => Promise<void>`                          | 重新读取并合并；进行中重复调用复用同一次读取，等待异步迁移完成       |
| `hasHydrated`  | `() => boolean`                                | 本轮恢复结束后为 `true`，包含失败与空数据情形                        |
| `onHydrate`    | `(callback: (state: T) => void) => () => void` | 订阅每次恢复完成；已恢复时在微任务中通知当前状态；取消函数可重复调用 |
| `clearStorage` | `() => Promise<void>`                          | 等此前异步写入结束后删除当前键，不修改内存状态                       |

### 五个内置后端

| 工厂                         | 返回类型               | 说明                                                   |
| ---------------------------- | ---------------------- | ------------------------------------------------------ |
| `memoryStorage()`            | `MemoryStorageAdapter` | 每个实例独立的 `Map`，同步；额外提供 `clear()`         |
| `localStorageBackend()`      | `StorageAdapter`       | 包装浏览器 `localStorage`，同步                        |
| `sessionStorageBackend()`    | `StorageAdapter`       | 包装浏览器 `sessionStorage`，同步                      |
| `cookieStorage(options?)`    | `StorageAdapter`       | 使用 `document.cookie`，键与值做 URL 编码，同步        |
| `indexedDBStorage(options?)` | `StorageAdapter`       | 懒加载并复用连接，事务 `oncomplete` 后才确认成功，异步 |

后端配置项（均在 `types.ts` 定义）：

| 配置                      | 字段                                                                               | 默认值                              |
| ------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------- |
| `CookieStorageOptions`    | `maxAge?`、`path?`、`sameSite?: "strict" \| "lax" \| "none"`、`secure?`、`domain?` | `path: "/"`                         |
| `IndexedDBStorageOptions` | `dbName?`、`storeName?`、`dbVersion?`                                              | `"slux-storage"` / `"keyval"` / `1` |

Cookie 的 `removeItem` 用 `max-age=0` 删除，并沿用相同的 `path`、`domain`、`secure`、`sameSite`。IndexedDB 在收到 `versionchange` 事件时会释放旧连接，连接失败后允许重试。

### 自定义 `StorageAdapter`

三个方法都可以同步返回或返回 `Promise`，`persist` 会分别处理：

```ts
import type { StorageAdapter } from "@slux/storage";

const adapter: StorageAdapter = {
  getItem: (key) => Promise.resolve(null),
  setItem: async (key, value) => {
    /* 保存字符串 */
  },
  removeItem: async (key) => {
    /* 删除键 */
  },
};
```

服务端读取请求 Cookie、写响应 Cookie 或接入自定义远端存储，都通过实现这个契约完成；浏览器后端不会自动读取服务端请求上下文。

## 专属语义与边界

**恢复（hydration）**：`init` 时若 `skipHydration` 为 `false` 自动调用 `rehydrate()`。同步后端在 `createStore` 返回前即完成恢复；异步后端先返回初始状态，`Promise` 就绪后再合并。默认 `merge` 是浅合并且持久化字段覆盖当前字段，因此**异步恢复会覆盖等待期间修改过的同名字段**；需要保留本地字段时提供 `merge`，或在 hydration 完成前暂缓编辑。

**envelope 校验**：入口只校验顶层对象含 `state`、`version` 是有限数字；缺 `version` 按 `0` 处理；`raw` 为 `null` 或空字符串视为无数据。业务字段的结构由应用自己的 `deserialize` 或 `migrate` 校验。非法 JSON、非对象、`version` 非数字都会报 `DeserializationFailed` 且保持初始状态。

**版本迁移**：`envelope.version === version` 时直接合并；版本不同且未提供 `migrate` 时忽略旧数据（仍标记 hydrated）；提供 `migrate` 时，同步返回值或 `Promise` 结果都会被应用，之后的写入使用当前 `version`。

**写入时机与队列**：`onSet` 先 `next(partial)` 提交，再 `persistState()`；序列化失败只报 `SerializationFailed`，不回滚已提交的内存状态。异步 `setItem` / `removeItem` 通过 `writeTail` 按调用顺序串行，避免旧写入覆盖新值；`clearStorage()` 排在此前写入之后；一次写入失败不阻塞后续写入。

**错误**：`PERSIST_ERROR_CODE` 提供 `StorageReadFailed`、`StorageWriteFailed`、`SerializationFailed`、`DeserializationFailed`、`MigrationFailed`。删除失败归为写入错误，`partialize` 失败归为序列化错误。`onError` 回调自身抛错被隔离，不影响状态更新与其他观察器。

**销毁**：`destroy()` 后取消尚未开始的写入与删除、清空 hydration 回调、让等待中的 `rehydrate()` 立即 resolve，并忽略迟到的恢复结果。已经交给后端的操作无法撤回。

**SSR 与后端降级**：`skipHydration: true` 适合服务端。Web Storage 与 cookie 后端在 `localStorage` / `sessionStorage` / `document` 缺失、访问被拒或容量不足时返回 `null` 或忽略写入，这类被后端吞掉的错误**不会**触发 `onError`；`indexedDBStorage()` 在无 `indexedDB` 时返回 rejected Promise，由 `persist` 报告 `StorageReadFailed` / `StorageWriteFailed`。

## 自动导入

`createAutoImportApis(prefix?)` 通过 `@slux/shared` 的 `generateBatchAutoImports` 生成 `unplugin-auto-import` 的 `ImportsMap`，来源名为 `@slux/storage`。登记清单以 `src/auto-import-api.ts` 为准，共 7 项：

`PERSIST_ERROR_CODE`、`cookieStorage`、`indexedDBStorage`、`localStorageBackend`、`memoryStorage`、`persist`、`sessionStorageBackend`

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/storage";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

传入字符串前缀会为登记项生成带前缀别名（如 `createAutoImportApis("u")` 把 `persist` 映射为 `uPersist`）；前缀以小写字母结尾时 API 名首字母大写，否则直接拼接。`createAutoImportApis` 本身不登记。

## 类型导出

`src/index.ts` 通过 `export type * from "./types.js"` 导出：`StorageAdapter`、`MemoryStorageAdapter`、`PersistEnvelope<T>`、`PersistErrorCode`、`PersistError`、`PersistListener<T>`、`PersistMiddlewareAPI<T>`、`PersistSetFn<T>`、`PersistOptions<T>`、`PersistMiddleware<T>`、`CookieStorageOptions`、`IndexedDBStorageOptions`。

其中 `PersistListener` / `PersistMiddlewareAPI` / `PersistSetFn` 是 `@slux/store` 的 `Listener` / `MiddlewareAPI` / `SetFn` 别名；`PERSIST_ERROR_CODE` 是运行时常量，不属于类型导出。

## 不适用的场景

- 状态含函数、循环引用或 `BigInt` 等不可 JSON 序列化的值：默认 `serialize` 会抛错，需 `partialize` 剔除或自定义 `serialize` / `deserialize`。
- 要求「写入必须成功」：异步后端写入是 fire-and-forget，失败只经 `onError` 报告。
- 需要跨标签实时同步：使用 `@slux/tab-sync`；本包只与本地/远端存储交互。
- 需要持久化撤销/重做历史栈：本包只保存状态快照，历史栈本身不持久化。

## 版本、许可与反馈

| 项       | 值                                         | 来源                                      |
| -------- | ------------------------------------------ | ----------------------------------------- |
| 版本     | `0.1.0`                                    | `package.json`                            |
| 许可     | MIT                                        | `package.json` / [LICENSE](../../LICENSE) |
| 问题反馈 | `https://github.com/itmanyong/slux/issues` | `package.json` `bugs`                     |

> `pnpm add` 基于 `package.json` 的发布配置；是否已实际发布到 npm 及线上版本号无法从源码确认。
