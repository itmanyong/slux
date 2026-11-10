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
- 问题反馈：`https://github.com/itmanyong/slux/issues`。
- 通用约定与本地开发命令见 [仓库根 README](../../README.md)。
