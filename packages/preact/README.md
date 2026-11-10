# @slux/preact

Preact 11（`preact@^11.0.0`）的 slux 绑定，基于 `@slux/core` 的 `Subscribable<T>` 订阅模型。原生绑定形式是 **Preact 原生 hooks + `preact/compat` 的 `useSyncExternalStore`**：把任意可订阅源读成组件里的一个值，**不依赖 React**。所有写入仍走原实例，绑定只读。

## 特性与适用场景

| 项       | 说明                                                                        |
| -------- | --------------------------------------------------------------------------- |
| 绑定形式 | `useSignal(source)` 返回 `T`；由 `useSyncExternalStore` 订阅                |
| 框架依赖 | `preact`、`preact/hooks`；`useSyncExternalStore` 取自 `preact/compat`       |
| 范式覆盖 | core 主入口 + atom / store / proxy / flux / state-machine / rxjs 六个子入口 |
| SSR      | 通过 `getServerSnapshot` 与 `ScopeProvider` 提供首屏快照，支持 hydration    |

| 场景                                          | 是否适合 | 说明                                               |
| --------------------------------------------- | -------- | -------------------------------------------------- |
| 在 Preact 组件里读 core `signal` / `computed` | 适合     | `computed` 由订阅内的 core `effect` 主动刷新       |
| 用 atom / store / proxy 或新增三种范式        | 适合     | 从对应子入口导入，范式包按需安装                   |
| SSR 首屏 + hydration                          | 适合     | `ScopeProvider` 提供服务端覆盖快照                 |
| 需要绑定替你写入状态                          | 不适合   | 绑定只读原实例，写入走 `set` / `dispatch` / `send` |
| 脱离 Preact 的 Node 脚本读状态                | 不适合   | 直接用 `@slux/core`                                |

## 安装

```sh
pnpm add @slux/core @slux/preact preact@^11
```

- **必需 peer**：`@slux/core`（`workspace:^`）、`preact@^11.0.0`。
- **可选 peer（范式包）**：`@slux/atom`、`@slux/store`、`@slux/proxy`、`@slux/flux`、`@slux/state-machine`、`@slux/rxjs` 均为 `optional`，**只装实际使用的子入口**。
- `@slux/shared` 是本包运行时依赖，安装时自动带入，无需显式声明。
- 主入口与每个子入口都通过 `exports` 同时提供 ESM（`import`）、CJS（`require`）与 `.d.ts` / `.d.cts` 类型声明。

`package.json` 的 `exports` 子入口（逐个列出）：

| 子路径                       | 导出内容                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `@slux/preact`               | 主入口：`useSignal`、`ScopeContext`、`ScopeProvider`、`useScopeContext`、`createAutoImportApis` |
| `@slux/preact/atom`          | `useAtomValue`、`useSetAtom`、`useAtom`                                                         |
| `@slux/preact/store`         | `useStore`                                                                                      |
| `@slux/preact/proxy`         | `useSnapshot`                                                                                   |
| `@slux/preact/flux`          | `useFluxStore`                                                                                  |
| `@slux/preact/state-machine` | `useMachine`                                                                                    |
| `@slux/preact/rxjs`          | `useObservable`                                                                                 |
| `@slux/preact/package.json`  | 包元数据（非 API）                                                                              |

## 快速开始

```tsx
import { signal } from "@slux/core";
import { useSignal } from "@slux/preact";

const count = signal(0);

export function Counter() {
  const value = useSignal(count);
  return <button onClick={() => count.set((n) => n + 1)}>{value}</button>;
}
```

`useSignal(count)` 返回 `number`；点击时仍通过 core 的 `count.set(recipe)` 写入，组件随订阅自动重渲染。

## 主入口 API

主入口导出 `useSignal`、`ScopeContext`、`ScopeProvider`、`useScopeContext`、`createAutoImportApis`。

| 成员                   | 签名                                        | 行为                                                     |
| ---------------------- | ------------------------------------------- | -------------------------------------------------------- |
| `useSignal`            | `<T>(source: Subscribable<T>) => T`         | 用 `useSyncExternalStore` 订阅并返回当前值               |
| `ScopeContext`         | `createContext<Scope \| null>(null)`        | Preact Context，默认 `null`                              |
| `ScopeProvider`        | `({ scope, children }: ScopeProviderProps)` | 把 `scope` 放进 `ScopeContext.Provider`，渲染 `children` |
| `useScopeContext`      | `() => Scope \| null`                       | 读取当前 `ScopeContext`，无 provider 时为 `null`         |
| `createAutoImportApis` | `(prefix?: string) => ImportsMap`           | 生成 `unplugin-auto-import` 配置，见「自动导入」         |

`useSignal` 的三个 `useSyncExternalStore` 参数由源码固定：

| 参数                | 实现                                                                                   | 作用                                         |
| ------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------- |
| `subscribe`         | `source.subscribe(notify)` + `effect(() => { source.get(); })`，返回同时释放二者的函数 | 订阅变化并主动驱动惰性 `computed`            |
| `getSnapshot`       | `() => source.get()`                                                                   | 客户端读取全局当前值                         |
| `getServerSnapshot` | `scope ? scope.get(source) : source.get()`                                             | 服务端读取；`scope` 来自 `useScopeContext()` |

`subscribe`、`getSnapshot` 的回调依赖 `[source]`，`getServerSnapshot` 依赖 `[scope, source]`，因此**来源切换会先释放旧订阅再建立新订阅**；`effect` 保证 core `computed` 即使只有绑定读取也会向订阅者发布最新值。

Scope 用法：

```tsx
import { createScope, signal } from "@slux/core";
import { ScopeProvider, useScopeContext, useSignal } from "@slux/preact";

const source = signal(1);
const scope = createScope();
scope.set(source, 10);

function Value() {
  const injected = useScopeContext();
  return (
    <span>
      {useSignal(source)}:{injected?.get(source)}
    </span>
  );
}

const app = (
  <ScopeProvider scope={scope}>
    <Value />
  </ScopeProvider>
);
```

## 子入口 API

所有子入口都只读原实例，**不返回写入 tuple，也不创建副本**。

### `@slux/preact/atom`

| 导出           | 签名                                              | 返回值 / 写入                                                  |
| -------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| `useAtomValue` | `<T>(source: AnyReadableAtom<T>) => T`            | 只读值，支持只读派生 atom                                      |
| `useSetAtom`   | `<T>(source: Atom<T>) => (value: T) => void`      | 稳定 setter；按 atom 替换契约写值，函数值不被当作 updater 执行 |
| `useAtom`      | `<T>(source: Atom<T>) => [T, (value: T) => void]` | `[值, setter]`                                                 |

```tsx
import { atom } from "@slux/atom";
import { useAtom } from "@slux/preact/atom";

const count = atom(1);

export function Counter() {
  const [value, setCount] = useAtom(count);
  return <button onClick={() => setCount(value + 1)}>{value}</button>;
}
```

### `@slux/preact/store`

`useStore` 有两个重载：

| 调用                                     | 返回值       |
| ---------------------------------------- | ------------ |
| `useStore(store)`                        | 完整 `State` |
| `useStore(store, selector, equalityFn?)` | `Selection`  |

`selector = (state: State) => Selection`；`equalityFn(previous, next)` 默认 `Object.is`。带 selector 时按 state 引用缓存选值，`equalityFn` 判定相等时保留旧选值引用。写入仍用 `store.setState(...)`，绑定不写入。

### `@slux/preact/proxy`

| 导出          | 签名                                           | 返回值                                          |
| ------------- | ---------------------------------------------- | ----------------------------------------------- |
| `useSnapshot` | `<T extends object>(source: T) => Snapshot<T>` | 整个 proxy 的深只读、冻结快照，不做字段访问追踪 |

### 新增三种范式（只读）

| 子路径                       | 导出            | 签名                                                                                                                                               | 返回值        | 写入方式                 |
| ---------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------ |
| `@slux/preact/flux`          | `useFluxStore`  | `<State, Action extends { type: string }>(store: FluxStore<State, Action>) => State`                                                               | Flux 完整状态 | `store.dispatch(action)` |
| `@slux/preact/state-machine` | `useMachine`    | `<Context, Event extends { type: string }, State extends string>(machine: StateMachine<Context, Event, State>) => MachineSnapshot<Context, State>` | 状态机快照    | `machine.send(event)`    |
| `@slux/preact/rxjs`          | `useObservable` | `<T>(source: ObservableState<T>) => T`                                                                                                             | 桥接最近值    | 桥接创建者持有上游       |

三者内部都复用主入口的 `useSignal(source)`。

## 专属语义与边界

- **SSR / hydration**：`useSyncExternalStore` 在服务端调用 `getServerSnapshot`，`ScopeProvider` 提供的 `scope.get(source)` 作为首屏值；SSR 阶段**不建立** `source.subscribe` 与 core `effect`。hydrate 挂载后切换到 `getSnapshot`，开始跟随全局值。`useSyncExternalStore` 本身保证「渲染到订阅之间」的写入不会丢失。
- **Scope 边界**：`ScopeProvider` 只影响 `useSignal` 的服务端快照；`atom` / `store` / `proxy` 子入口把 `getSnapshot` 同时用作 `getServerSnapshot`，**不应用 core scope**。`scope.set()` 不触发全局订阅，`runInScope` 不改写 signal 读写（通用约定见仓库根 README）。
- **订阅与清理**：每个绑定在 `subscribe` 内建立 `source.subscribe` 与一个 core `effect`；来源切换（`[source]` 变化）与组件卸载时二者一起释放。组件卸载**不销毁**业务 store / flux / machine / observable，桥接创建者负责调用 `dispose()`。
- **快照相等判定**：`useSyncExternalStore` 用 `Object.is` 比较 `getSnapshot` 结果；`computed` 派生值相等时不重渲染。`useStore` 的 `equalityFn` 与 `@slux/proxy` 的不可变快照负责在各自入口保留相等结果的旧引用。
- **错误处理**：绑定层不新增错误包装；写入、通知与 `effect` 的错误行为遵循 `@slux/core`。RxJS 桥接的完成 / 错误状态由 `@slux/rxjs` 的 `status` / `error` 只读信号读取。
- **通用约定**：跨框架的写入形式、Scope、SSR 与桥接生命周期约定见 [仓库根 README](../../README.md) 的「框架适配 · 通用约定」；仓库内验证命令见「本地开发」，本文不重复。

## 自动导入

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/preact";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

`createAutoImportApis(prefix = "")` 的登记清单以 `src/auto-import-api.ts` 的 `allImportApis` 为准，当前为 **`ScopeContext`、`ScopeProvider`、`useScopeContext`、`useSignal`** 四项，来源名 `@slux/preact`。传入前缀可生成别名，大写规则由 `@slux/shared` 的 `generateBatchAutoImports` 决定。清单**只含主入口 API**，不含 `createAutoImportApis` 自身，也不含任何子入口导出。

## 类型导出

本包显式 `export type` 的只有主入口的 `ScopeProviderProps`：

```ts
type ScopeProviderProps = { scope: Scope; children?: ComponentChildren };
```

`Scope` / `Subscribable<T>` 来自 `@slux/core`，`ComponentChildren` 来自 `preact`。各子入口没有显式 `export type`；`AnyReadableAtom` / `Atom`（`@slux/atom`）、`StoreApi`（`@slux/store`）、`Snapshot`（`@slux/proxy`）、`FluxStore`、`MachineSnapshot`、`ObservableState` 等类型通过函数签名暴露，从各自范式包导入。

## 不适用的场景

- 需要在组件外（Node / 脚本）读写状态：用 `@slux/core`，绑定只在 Preact 组件内工作。
- 需要绑定返回写入 tuple、selector 之外的写入接口或状态副本：绑定只读原实例。
- React 项目混用：用 `@slux/react`，两者运行时不同。
- 需要自动的请求级状态隔离或自动序列化 / 恢复：见仓库根 README 的通用约定，需调用方按请求建实例。

## 版本、许可与反馈

- 版本：`0.1.0`（`package.json`）；许可：[MIT](../../LICENSE) © itmanyong。
- 问题反馈：[GitHub Issues](https://github.com/itmanyong/slux/issues)。
- 通用约定与本地开发命令见 [仓库根 README](../../README.md)。

<!-- package-navigation:start -->

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

<!-- package-navigation:end -->
