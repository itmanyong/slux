# @slux/ripple

Ripple（`ripple@^0.6.1`）的 slux 绑定，基于 `@slux/core` 的 `Subscribable<T>` 订阅模型。原生绑定形式是 **Ripple 原生 `track` / `effect`**：所有绑定返回 `Derived<T>`，以 **`.value` 读取**。`.` 入口按 `browser` / `default` 条件分流到客户端与服务端实现。所有写入仍走原实例，绑定只读。

## 特性与适用场景

| 项       | 说明                                                                                |
| -------- | ----------------------------------------------------------------------------------- |
| 绑定形式 | `useSignal(source)` 及六个子入口返回 `Derived<T>`，以 `.value` 读取                 |
| 框架依赖 | `ripple` 的 `track`、`effect`、`Context`；服务端用 `ripple/server` 的 `render`      |
| 范式覆盖 | core 主入口 + atom / store / proxy / flux / state-machine / rxjs 六个子入口         |
| SSR      | `default` 条件 / `@slux/ripple/server` 提供不订阅的服务端 `useSignal`，读显式 Scope |

| 场景                                              | 是否适合 | 说明                                                  |
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

| 子路径                       | 条件 / 产物                                                                   | 导出内容                                                                               |
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

`useSignal(count)` 返回 `Derived<number>`，模板用 `.value` 读取；点击时仍通过 core 的 `count.set(recipe)` 写入。

## 主入口 API

主入口的运行时导出来自 `src/index.ts`（客户端）与 `src/scope.ts`；`scope.ts` 的三个导出在客户端与服务端入口都会重新导出。

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

所有子入口返回 `Derived<T>`，以 `.value` 读取；**不返回写入 tuple，也不创建副本**。

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

`createAutoImportApis(prefix = "")` 的登记清单以 `src/auto-import-api.ts` 的 `allImportApis` 为准，当前为 **`ScopeContext`、`provideScope`、`useScopeContext`、`useSignal`** 四项，来源名 `@slux/ripple`。传入前缀可生成别名，大写规则由 `@slux/shared` 的 `generateBatchAutoImports` 决定。清单**只含主入口运行时导出**，不含 `createAutoImportApis` 自身，也不含任何子入口导出。

## 类型导出

本包**没有显式 `export type`**：`Derived<T>` 与 `Context` 来自 `ripple`，`Scope` / `Subscribable<T>` 来自 `@slux/core`，`Snapshot<T>` 来自 `@slux/proxy`，其余范式类型（`AnyReadableAtom` / `Atom`、`StoreApi`、`FluxStore` / `FluxAction`、`MachineSnapshot` / `StateMachine`、`ObservableState`）都通过函数签名暴露，从各自包导入。`ScopeContext` 是 `Context<Scope | null>` 实例，其类型由 `ripple` 提供。

## 不适用的场景

- 需要在组件外（Node / 脚本）读写状态：用 `@slux/core`。
- 需要绑定返回写入 tuple、selector 之外的写入接口或状态副本：返回的是只读 `Derived<T>`。
- 需要在同一组件实例内切换数据源：数据源在初始化时固定，需重建组件实例。
- 需要 CJS / `require` 消费：本包只发布 ESM。
- 未接入 Ripple 编译器：组件 JSX 与 `.value` 读取无法在消费端工作。

## 版本、许可与反馈

- 版本：`0.1.0`（`package.json`）；许可：[MIT](../../LICENSE) © itmanyong。
- 问题反馈：`https://github.com/itmanyong/slux/issues`。
- 通用约定与本地开发命令见 [仓库根 README](../../README.md)。
