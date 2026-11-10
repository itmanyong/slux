# @slux/ripple

🔌 Ripple（`ripple@^0.6.1`）的 slux 绑定，基于 `@slux/core` 的 `Subscribable<T>` 订阅模型。原生绑定形式是 **Ripple 原生 `track` / `effect`**：所有绑定返回 `Derived<T>`，以 **`.value` 读取**。`.` 入口按 `browser` / `default` 条件分流到客户端与服务端实现。所有写入仍走原实例，绑定只读。

[![GITHUB](https://img.shields.io/badge/GITHUB-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/itmanyong/slux/tree/main/packages/ripple) [![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/@slux/ripple) [![在线文档](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E6%96%87%E6%A1%A3-0F766E?style=for-the-badge)](https://itmanyong.github.io/slux/packages/ripple/)

## 特性与适用场景

| 🧩 项    | 说明                                                                                |
| -------- | ----------------------------------------------------------------------------------- |
| 绑定形式 | `useSignal(source)` 及六个子入口返回 `Derived<T>`，以 `.value` 读取                 |
| 框架依赖 | `ripple` 的 `track`、`effect`、`Context`；服务端用 `ripple/server` 的 `render`      |
| 范式覆盖 | core 主入口 + atom / store / proxy / flux / state-machine / rxjs 六个子入口         |
| SSR      | `default` 条件 / `@slux/ripple/server` 提供不订阅的服务端 `useSignal`，读显式 Scope |

| 🧭 场景                                           | 是否适合 | 说明                                                  |
| ------------------------------------------------- | -------- | ----------------------------------------------------- |
| 在 Ripple 编译组件里读 core `signal` / `computed` | 适合     | 订阅内 core `effect` 主动刷新惰性 computed            |
| 用 atom / store / proxy 或新增三种范式            | 适合     | 各子入口返回 `Derived`，范式包按需安装                |
| SSR 首屏读取 Scope 覆盖值                         | 适合     | 服务端 `useSignal` 读 `scope.get(source)`，不建立订阅 |
| 需要绑定替你写入状态                              | 不适合   | `Derived<T>` 只读，写入走 `set` / `dispatch` / `send` |
| 需要 CJS 消费                                     | 不适合   | 本包只发布 ESM                                        |
| 未接入 Ripple 编译器                              | 不适合   | 组件 JSX 与 `.value` 读取需消费端编译器处理           |

## 安装

```sh
pnpm add @slux/core @slux/ripple ripple@^0.6.1
```

- **必需 peer**：`@slux/core`（`workspace:^`）、`ripple@^0.6.1`。
- **可选 peer（范式包）**：`@slux/atom`、`@slux/store`、`@slux/proxy`、`@slux/flux`、`@slux/state-machine`、`@slux/rxjs` 均为 `optional`，**只装实际使用的子入口**。
- `@slux/shared` 是本包运行时依赖，安装时自动带入。
- 本包只发布 ESM：`exports` 没有 `require` 条件，也没有 `.d.cts`；`main` 指向 `dist/server.js`，`module` 指向 `dist/index.js`。
- 消费端组件（JSX 与 `.value` 读取）需按 Ripple 官方要求接入编译器，本包不内置编译器。

`package.json` 的 `exports` 子入口（逐个列出）：

| 📦 子路径                    | 条件 / 产物                                                                   | 导出内容                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `@slux/ripple`               | `browser` → `dist/index.js`（客户端）；`default` → `dist/server.js`（服务端） | `ScopeContext`、`provideScope`、`useScopeContext`、`useSignal`、`createAutoImportApis` |
| `@slux/ripple/server`        | `default` → `dist/server.js`                                                  | `ScopeContext`、`provideScope`、`useScopeContext`、服务端 `useSignal`                  |
| `@slux/ripple/atom`          | `default` → `dist/atom.js`                                                    | `useAtomValue`、`useSetAtom`、`useAtom`                                                |
| `@slux/ripple/store`         | `default` → `dist/store.js`                                                   | `useStore`                                                                             |
| `@slux/ripple/proxy`         | `default` → `dist/proxy.js`                                                   | `useSnapshot`                                                                          |
| `@slux/ripple/flux`          | `default` → `dist/flux.js`                                                    | `useFluxStore`                                                                         |
| `@slux/ripple/state-machine` | `default` → `dist/state-machine.js`                                           | `useMachine`                                                                           |
| `@slux/ripple/rxjs`          | `default` → `dist/rxjs.js`                                                    | `useObservable`                                                                        |
| `@slux/ripple/package.json`  | 包元数据（非 API）                                                            | —                                                                                      |

## 快速开始

```tsx
import { signal } from "@slux/core";
import { useSignal } from "@slux/ripple";

const count = signal(0);

export function Counter() {
  const value = useSignal(count);
  return <button onClick={() => count.set((n) => n + 1)}>{value.value}</button>;
}
```

🚀 `useSignal(count)` 返回 `Derived<number>`，模板用 `.value` 读取；点击时仍通过 core 的 `count.set(recipe)` 写入。

## 主入口 API

🧭 主入口的运行时导出来自 `src/index.ts`（客户端）与 `src/scope.ts`；`scope.ts` 的三个导出在客户端与服务端入口都会重新导出。

| 成员                             | 签名                                         | 行为                                                                                                                                                  |
| -------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useSignal`（客户端）            | `<T>(source: Subscribable<T>) => Derived<T>` | 基于 `useExternal`：`track` 状态 + `effect` 建立订阅并刷新；订阅内 `source.subscribe` 与 core `effect(() => { source.get(); })` 同时驱动惰性 computed |
| `useSignal`（服务端，`/server`） | `<T>(source: Subscribable<T>) => Derived<T>` | `track(() => (scope ? scope.get(source) : source.get()))`，**不建立订阅**                                                                             |
| `ScopeContext`                   | `new Context<Scope \| null>(null)`           | Ripple 原生 Context，默认 `null`                                                                                                                      |
| `provideScope`                   | `(scope: Scope) => void`                     | `ScopeContext.set(scope)`，在父组件初始化中调用                                                                                                       |
| `useScopeContext`                | `() => Scope \| null`                        | `ScopeContext.get()`                                                                                                                                  |
| `createAutoImportApis`           | `(prefix?: string) => ImportsMap`            | 生成 `unplugin-auto-import` 配置，见「自动导入」                                                                                                      |

内部 `useExternal`（`src/external.ts`，**不由 `exports` 暴露**）是所有客户端绑定的共同机制：用 `track({ value: read() })` 包裹值（避免 Ripple `track` 把函数类型的值误当作派生计算执行），在 `effect` 内订阅、刷新并把 `unsubscribe` 作为清理返回，最后返回 `track(() => state.value.value)` 形式的 `Derived<T>`。六个子入口都基于它。

服务端 `useSignal` 与 Scope 用法：

```ts
import { render } from "ripple/server";
import { createScope, signal } from "@slux/core";
import { provideScope, useSignal } from "@slux/ripple/server";

const source = signal(1);
const scope = createScope();
scope.set(source, 42);

const result = await render(() => {
  provideScope(scope);
  return String(useSignal(source).value); // 读取 Scope 覆盖值
});
```

## 子入口 API

🧭 所有子入口返回 `Derived<T>`，以 `.value` 读取；**不返回写入 tuple，也不创建副本**。

### `@slux/ripple/atom`

| 导出           | 签名                                                     | 返回值 / 写入                                |
| -------------- | -------------------------------------------------------- | -------------------------------------------- |
| `useAtomValue` | `<T>(atom: AnyReadableAtom<T>) => Derived<T>`            | 只读派生值，支持只读派生 atom                |
| `useSetAtom`   | `<T>(atom: Atom<T>) => (value: T) => void`               | setter；按 atom 替换契约写值，函数值不被执行 |
| `useAtom`      | `<T>(atom: Atom<T>) => [Derived<T>, (value: T) => void]` | `[只读派生值, setter]`                       |

### `@slux/ripple/store`

`useStore` 有两个重载：

| 调用                                     | 返回值                       |
| ---------------------------------------- | ---------------------------- |
| `useStore(store)`                        | `Derived<State>`（完整状态） |
| `useStore(store, selector, equalityFn?)` | `Derived<Selection>`（选值） |

`selector = (state: State) => Selection`；`equalityFn(previous, next)` 默认 `Object.is`。带 selector 时按 state 引用缓存选值，`equalityFn` 判定相等时保留旧选值引用。写入仍用 `store.setState(...)`。

```tsx
import { createStore } from "@slux/store";
import { useStore } from "@slux/ripple/store";

const store = createStore(() => ({ count: 1 }));

export function Count() {
  const count = useStore(store, (state) => state.count);
  return <output>{count.value}</output>;
}
```

### `@slux/ripple/proxy`

| 导出          | 签名                                                   | 返回值                                        |
| ------------- | ------------------------------------------------------ | --------------------------------------------- |
| `useSnapshot` | `<T extends object>(proxy: T) => Derived<Snapshot<T>>` | 整个 proxy 的深只读、冻结快照，无字段访问追踪 |

### 新增三种范式（只读）

| 子路径                       | 导出            | 签名                                                                                                                                                        | 返回值        | 写入方式                 |
| ---------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------ |
| `@slux/ripple/flux`          | `useFluxStore`  | `<State, Action extends FluxAction>(store: FluxStore<State, Action>) => Derived<State>`                                                                     | Flux 完整状态 | `store.dispatch(action)` |
| `@slux/ripple/state-machine` | `useMachine`    | `<Context, Event extends { type: string }, State extends string>(machine: StateMachine<Context, Event, State>) => Derived<MachineSnapshot<Context, State>>` | 状态机快照    | `machine.send(event)`    |
| `@slux/ripple/rxjs`          | `useObservable` | `<T>(source: ObservableState<T>) => Derived<T>`                                                                                                             | 桥接最近值    | 桥接创建者持有上游       |

三者都基于 `useExternal`：`read` 取各自实例的 `.get()`，`subscribe` 取各自实例的 `.subscribe(notify)`。

## 专属语义与边界

- **条件导出与 SSR**：`.` 入口的 `browser` 条件选客户端 `index.js`，`default` 条件选服务端 `server.js`；`main` 指向 `server.js`，`module` 指向 `index.js`，也可显式导入 `@slux/ripple/server`。服务端渲染时 Ripple **不执行 `effect`**，因此基于 `useExternal` 的所有子入口（以及客户端 `useSignal`）不会建立 `source.subscribe` 订阅，首值来自 `read()` 的同步求值；服务端 `useSignal` 进一步读取 `scope.get(source)` 覆盖值。子入口在服务端读各自实例的当前值，**不应用 core Scope**。
- **客户端 Scope**：`ScopeContext` 用 Ripple 原生 `Context`；父组件初始化中 `provideScope(scope)`，后代用 `useScopeContext()` 取得。**客户端 `useSignal` 不读 Scope 覆盖值**，始终读取并跟随全局来源；覆盖值只由服务端入口的 `useSignal` 应用，或由调用方显式 `useScopeContext()?.get(source)` 读取。服务端按请求创建独立状态实例与 Scope，不自动序列化 / 恢复（通用约定见 [仓库根 README](../../README.md)）。
- **订阅与清理**：`useExternal` 在 Ripple 原生 `effect` 内建立订阅并把 `unsubscribe` 作为清理函数返回，组件卸载时释放组件订阅；主入口 `useSignal` 额外建立 core `effect` 驱动惰性 computed。组件卸载**不销毁**业务 store / flux / machine / observable，桥接创建者负责 `dispose()`。
- **数据源固定**：`useExternal` 的订阅在组件初始化时建立一次（Ripple `effect` 不接收依赖数组），**组件实例内数据源固定**；需要替换来源时重建该组件实例。这与用 `useCallback` / `componentDidUpdate` 可重连来源的框架绑定不同。
- **快照相等判定**：订阅触发时 `useExternal` 重新 `read()` 并写入 `track` 状态；`useStore` 的 `equalityFn`（默认 `Object.is`）在选值相等时保留旧引用，`@slux/proxy` 的不可变快照保持未变分支引用。`external.ts` 用 `{ value: read() }` 包裹值，保证函数类型的值不被 `track` 当作派生计算执行。
- **错误处理**：绑定层不新增错误包装；写入、通知与 `effect` 的错误行为遵循 `@slux/core`。RxJS 桥接的完成 / 错误状态由 `@slux/rxjs` 的 `status` / `error` 只读信号读取。
- **通用约定**：跨框架的写入形式、Scope、SSR 与桥接生命周期约定见 [仓库根 README](../../README.md) 的「框架适配 · 通用约定」；仓库内验证命令见「本地开发」，本文不重复。

## 自动导入

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/ripple";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

🔌 `createAutoImportApis(prefix = "")` 的登记清单以 `src/auto-import-api.ts` 的 `allImportApis` 为准，当前为 **`ScopeContext`、`provideScope`、`useScopeContext`、`useSignal`** 四项，来源名 `@slux/ripple`。传入前缀可生成别名，大写规则由 `@slux/shared` 的 `generateBatchAutoImports` 决定。清单**只含主入口运行时导出**，不含 `createAutoImportApis` 自身，也不含任何子入口导出。

## 类型导出

💡 本包**没有显式 `export type`**：`Derived<T>` 与 `Context` 来自 `ripple`，`Scope` / `Subscribable<T>` 来自 `@slux/core`，`Snapshot<T>` 来自 `@slux/proxy`，其余范式类型（`AnyReadableAtom` / `Atom`、`StoreApi`、`FluxStore` / `FluxAction`、`MachineSnapshot` / `StateMachine`、`ObservableState`）都通过函数签名暴露，从各自包导入。`ScopeContext` 是 `Context<Scope | null>` 实例，其类型由 `ripple` 提供。

## 不适用的场景

- 需要在组件外（Node / 脚本）读写状态：用 `@slux/core`。
- 需要绑定返回写入 tuple、selector 之外的写入接口或状态副本：返回的是只读 `Derived<T>`。
- 需要在同一组件实例内切换数据源：数据源在初始化时固定，需重建组件实例。
- 需要 CJS / `require` 消费：本包只发布 ESM。
- 未接入 Ripple 编译器：组件 JSX 与 `.value` 读取无法在消费端工作。

## 版本、许可与反馈

- 版本：`0.1.0`（`package.json`）；许可：[MIT](../../LICENSE) © itmanyong。
- 问题反馈：[GitHub Issues](https://github.com/itmanyong/slux/issues)。
- 通用约定与本地开发命令见 [仓库根 README](../../README.md)。

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
