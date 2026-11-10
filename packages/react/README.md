# @slux/react

🔌 把 `@slux/core` 的响应式状态接入 React 18 / 19。核心绑定 `useSignal` 是基于 `useSyncExternalStore` 的 hook，读取任意 `Subscribable<T>` 并返回 `T`；主入口另提供 core `Scope` 的 Context 组件与 `createAutoImportApis`。六个范式各通过独立子入口提供只读 hook，写入仍走原实例。

[![GITHUB](https://img.shields.io/badge/GITHUB-181717?style=for-the-badge&logo=github&logoColor=white&color=green)](https://github.com/itmanyong/slux/tree/main/packages/react) [![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white&color=orange)](https://www.npmjs.com/package/@slux/react) [![文档](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E6%96%87%E6%A1%A3-0F766E?style=for-the-badge&color=blue)](https://itmanyong.github.io/slux/packages/react/)

跨框架一致的子入口划分、Flux / 状态机 / RxJS 的写入与桥接生命周期、Scope 显式覆盖语义与 SSR 通用约束见仓库根 [README](../../README.md) 的「框架适配 · 通用约定」；仓库内构建与验证命令见「本地开发」，本文不再重复。

## 特性与适用场景

| 🧭 场景                                                                | 是否适合 | 说明                                                                       |
| ---------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| 在 React 18 / 19 函数组件里读 signal、computed 或自定义 `Subscribable` | 适合     | `useSignal` 返回 `T`，值变化时触发重渲染                                   |
| 用 Context 为渲染树提供请求级 `Scope` 覆盖                             | 适合     | `ScopeProvider` / `useScopeContext`，服务端与 hydration 首次快照读取 scope |
| 消费 atom、store、proxy、flux、state-machine、rxjs 六种范式            | 适合     | 六个 `/xxx` 子入口分别导出对应 hook                                        |
| 需要自动请求级隔离、把 Scope 写回全局，或脱离组件的长期订阅            | 不适合   | 绑定只读且随组件生命周期，脱离组件请用 `@slux/core` 的 `effect`            |

## 安装

```sh
pnpm add @slux/react @slux/core react
```

| 📦 项      | 值                                                                                                                                    | 来源                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| React peer | `^18.0.0 \|\| ^19.0.0`                                                                                                                | `package.json` `peerDependencies` |
| 必需 peer  | `@slux/core`（`workspace:^`）                                                                                                         | 同上                              |
| 可选 peer  | `@slux/atom`、`@slux/store`、`@slux/proxy`、`@slux/flux`、`@slux/state-machine`、`@slux/rxjs`（均 `workspace:^` 且 `optional: true`） | `peerDependenciesMeta`            |
| 运行时依赖 | `@slux/shared`（随包安装）                                                                                                            | `dependencies`                    |

📦 范式包是**可选 peer，只安装实际使用的**：用哪个子入口就装哪个包；`@slux/core` 是全部入口的必需依赖。`react-dom` 与 `@types/react` 由应用自行提供。

`package.json` 的 `exports` 子入口（每个都提供 ESM `import` 与 CJS `require`，并带 `.d.ts` / `.d.cts`）：

| 📦 子入口                   | 说明                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `@slux/react`               | 主入口：`useSignal`、Scope Context、`createAutoImportApis` |
| `@slux/react/atom`          | atom 绑定                                                  |
| `@slux/react/store`         | store 绑定                                                 |
| `@slux/react/proxy`         | proxy 绑定                                                 |
| `@slux/react/flux`          | flux 绑定                                                  |
| `@slux/react/state-machine` | 状态机绑定                                                 |
| `@slux/react/rxjs`          | RxJS 桥接绑定                                              |
| `@slux/react/package.json`  | 包元信息                                                   |

## 快速开始

```tsx
import { computed, signal } from "@slux/core";
import { useSignal } from "@slux/react";

const count = signal(0);
const doubled = computed(() => count.get() * 2);

export function Counter() {
  const value = useSignal(count); // 0
  const double = useSignal(doubled); // 0
  return (
    <button onClick={() => count.set((current) => current + 1)}>
      {value} × 2 = {double}
    </button>
  );
}
```

## 主入口 API

### `useSignal`

```ts
function useSignal<T>(source: Subscribable<T>): T;
```

| 💡 行为             | 说明                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 实现                | `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`                                                                                 |
| `subscribe`         | `useCallback` 依赖 `[source]`；订阅 `source.subscribe`，同时起 core `effect(() => source.get())` 刷新惰性 computed；清理函数同时退订与释放 effect |
| `getSnapshot`       | `() => source.get()`，客户端正常渲染读取全局值                                                                                                    |
| `getServerSnapshot` | `() => scope ? scope.get(source) : source.get()`，服务端与 hydration 首次快照读取最近的 `ScopeProvider`                                           |
| 来源切换            | `source` 变化重建订阅，旧的 subscribe 与 effect 一并释放；相同来源引用保持稳定                                                                    |
| 函数值 / 对象值     | 快照直接来自 `source.get()`；函数值按原引用返回，对象不自动冻结（修改走 core 的 `set(recipe)`）                                                   |

💡 自定义来源只需满足 `Subscribable<T>`（`get()` + `subscribe(cb)`，后者返回取消函数）；值未变化时 `get()` 应返回稳定快照。

### Scope 相关

| 💡 导出              | 签名 / 类型                                               | 说明                                                                   |
| -------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| `ScopeContext`       | `Context<Scope \| null>`                                  | 默认值 `null`，可直接 `useContext(ScopeContext)`                       |
| `ScopeProvider`      | `(props: ScopeProviderProps) => ReactElement`             | 用 `createElement` 把 `scope` 放入 Provider；`children` 为 `ReactNode` |
| `useScopeContext`    | `() => Scope \| null`                                     | 返回最近的 Scope，无 Provider 时 `null`                                |
| `ScopeProviderProps` | `{ readonly scope: Scope; readonly children: ReactNode }` | Provider 属性类型（公开类型导出）                                      |

嵌套 Provider 取最近一层，替换 `scope` 同步更新到消费者；用法见「专属语义与边界」的 SSR 与 hydration。

## 子入口 API

🧭 六个子入口都**不返回写入 tuple 或 selector**：Flux / 状态机 / RxJS 的 hook 只读，写入通过原实例的 `dispatch`、`send` 或上游 Observable 完成（通用约定）。所有 hook 基于 `useSyncExternalStore`；服务端快照分两类：`/atom`、`/store`、`/proxy` 把 `getSnapshot` 直接作为 `getServerSnapshot`，SSR 用来源当前值、不读取 `ScopeProvider`；`/flux`、`/state-machine`、`/rxjs` 委托主入口 `useSignal`，服务端快照沿用其 Scope 覆盖语义。

| 🧭 子入口        | 导出                                    | 签名要点                                                                    | 返回值                                               | 写入方式                            |
| ---------------- | --------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------- |
| `/atom`          | `useAtom`、`useAtomValue`、`useSetAtom` | `<T>(atom)`                                                                 | `[T, (value: T) => void]`、`T`、`(value: T) => void` | `set(value)` 或 `atom.update(fn)`   |
| `/store`         | `useStore`                              | `(store, selector?, equalityFn?)`                                           | `State` / `Selection`                                | `store.setState(...)`               |
| `/proxy`         | `useSnapshot`                           | `<T extends object>(proxy: T)`                                              | `Snapshot<T>`                                        | 直接修改原 proxy                    |
| `/flux`          | `useFluxStore`                          | `<State, Action extends { type: string }>(store: FluxStore<State, Action>)` | `State`                                              | `store.dispatch(action)`            |
| `/state-machine` | `useMachine`                            | `<Context, Event extends { type: string }, State extends string>(machine)`  | `MachineSnapshot<Context, State>`                    | `machine.send(event)`               |
| `/rxjs`          | `useObservable`                         | `<T>(source: ObservableState<T>)`                                           | `T`                                                  | 上游 Observable，创建者 `dispose()` |

### `/atom`

```tsx
import { atom, derived } from "@slux/atom";
import { useAtom, useAtomValue } from "@slux/react/atom";

const count = atom(0);
const doubled = derived((get) => get(count) * 2);

function Counter() {
  const [value, set] = useAtom(count);
  const double = useAtomValue(doubled);
  return (
    <button onClick={() => set(value + 1)}>
      {value} × 2 = {double}
    </button>
  );
}
```

`useAtomValue` 可读基础、派生与 writable atom（`AnyReadableAtom<T>`），atom 包已主动刷新派生值，绑定无需再起 core `effect`；`useSetAtom` 只返回 setter、不订阅，调用 `atom.set(value)`（**替换值**，函数值直接保存，函数式更新用 `atom.update(fn)`）；`useAtom` 组合前两者。

### `/store`

```tsx
import { createStore } from "@slux/store";
import { useStore } from "@slux/react/store";

const store = createStore(() => ({ count: 0, label: "Counter" }));
function Counter() {
  const count = useStore(store, (state) => state.count);
  return <button onClick={() => store.setState({ count: count + 1 })}>{count}</button>;
}
```

`useStore(store)` 返回完整状态，带 `selector, equalityFn?` 时返回选值（默认 `Object.is`）。选值缓存用 `useMemo` 随 `[store, selector, equalityFn]` 重建：状态引用未变直接复用，`equalityFn` 判定相等时保留上次选值引用，避免对象 selector 导致循环渲染。组件卸载只退订、**不销毁** store；SSR 读 `getState()` 当前值（不是 `getInitialState()`）。

### `/proxy`

```tsx
import { observable } from "@slux/proxy";
import { useSnapshot } from "@slux/react/proxy";

const state = observable({ user: { name: "Alice" } });
function Profile() {
  const snap = useSnapshot(state);
  return (
    <button
      onClick={() => {
        state.user.name = "Bob";
      }}
    >
      {snap.user.name}
    </button>
  );
}
```

`useSnapshot` 返回 `Snapshot<T>`，缓存、冻结与结构共享沿用 `@slux/proxy` 的 `snapshot`；订阅范围是**整个 proxy 及嵌套变更**，不按读取属性筛选，快照深层只读，修改走原 proxy。

### `/flux`、`/state-machine`、`/rxjs`

三个 hook 都直接 `return useSignal(source)`，继承主入口的订阅、SSR 与 Scope 边界：

```tsx
import { createFluxStore } from "@slux/flux";
import { useFluxStore } from "@slux/react/flux";
import { useMachine } from "@slux/react/state-machine";
import { useObservable } from "@slux/react/rxjs";

const flux = createFluxStore((state: number, action: { type: "add"; amount: number }) => state + action.amount, 0);
function Total() {
  const value = useFluxStore(flux); // number
  return <button onClick={() => flux.dispatch({ type: "add", amount: 1 })}>{value}</button>;
}
// useMachine(machine) → MachineSnapshot<Context, State>（含 value / context），写入 machine.send(event)
// useObservable(observable) → T，写入走上游 Observable，创建者调用 dispose()
```

`useObservable` 只接收 `fromObservable(source, initialValue)` 产出的 `ObservableState<T>`，不接受原始 RxJS `Observable`；完成与错误读 `source.status` / `source.error`。组件卸载只解除自身绑定，桥接 `dispose()` 由创建者负责。

## 专属语义与边界

### SSR 与 hydration

- 服务端 `getServerSnapshot` 读取 `scope.get(source)`；无 Provider 或缺少覆盖值时回退 `source.get()`（含沿父 Scope 的继承）。不同请求用独立 Scope，互不影响。
- 服务端**不建立** `subscribe` 或 core `effect`：`useSyncExternalStore` 在服务端只调用 `getServerSnapshot`。
- computed 保留全局依赖语义：Scope 只覆盖信号取值，不隔离 computed 依赖或缓存。全局 `count = 1`、Scope 覆盖 `10` 时，`useSignal(count)` 为 `10`，`useSignal(computed(() => count.get() * 2))` 仍为 `2`。
- hydration 首次客户端快照也读 Scope：调用方需把服务端数据传给客户端、用相同数据初始化客户端 Scope 才能匹配；hydration 完成后正常渲染读取并订阅**全局**来源。Scope 值与全局值不同时页面切到全局值，`ScopeProvider` 不把作用域值写回全局信号。
- `/atom`、`/store`、`/proxy` 的 SSR 用各自来源当前值，不接入 `ScopeProvider`，也不自动使用 `createAtomScope()`；`/flux`、`/state-machine`、`/rxjs` 因委托 `useSignal`，服务端快照读 Scope。

### 订阅与清理

- `subscribe` 引用由 `useCallback([source])` 保持稳定；来源切换、组件卸载时同时释放 `source.subscribe` 与 core `effect`，卸载不销毁原状态实例。
- 值由 `useSyncExternalStore` 按 `Object.is` 比较 `getSnapshot()` 判定是否重渲染；来源返回稳定快照时相同值不触发更新。绑定不捕获异常，订阅回调与 `effect` 中的错误沿用 `@slux/core` 的同步执行与错误汇总语义。

### Scope 显式覆盖契约

`scope.set()` 不触发全局订阅，`runInScope()` 不改写全局 signal 读写；客户端正常渲染仍读全局值。这部分沿用 core 的 Scope 契约，见根 README 通用约定。

## 自动导入

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/react";

export default { plugins: [AutoImport({ imports: [createAutoImportApis()] })] };
```

🔌 `createAutoImportApis(prefix?)` 返回 `unplugin-auto-import` 的 `ImportsMap`，来源名 `@slux/react`。`src/auto-import-api.ts` 当前登记：`ScopeContext`、`ScopeProvider`、`useScopeContext`、`useSignal`（仅主入口 API，**不含** `createAutoImportApis` 自身与各子入口 hook，需手动 import）。传入前缀时按 `@slux/shared` 的 `createAutoImports` 规则生成别名（前缀以小写字母结尾时把标识符首字母大写后拼接）。

## 类型导出

💡 主入口只导出一个类型：`ScopeProviderProps`（`src/types/index.ts`）=`{ readonly scope: Scope; readonly children: ReactNode }`。六个子入口只导出运行时函数，不额外导出类型；`Subscribable` / `Scope` 来自 `@slux/core`，`Snapshot` 来自 `@slux/proxy`，`FluxStore` / `MachineSnapshot` / `ObservableState` 来自各自范式包，均按包名从原包导入。

## 不适用的场景

- ⚠️ 需要脱离 React 组件生命周期的长期订阅，或在 Node / 非 React 环境使用：直接用 `@slux/core`。
- 期望绑定返回写入 tuple、selector、自动把 Scope 写回全局，或 SSR 自动序列化 / 恢复请求状态：绑定只读，需调用方自行准备客户端初始数据与 Scope，见根 README 通用约定。

## 版本、许可与反馈

- 版本 `0.2.5`（`package.json`）· 许可 [MIT](../../LICENSE) © itmanyong · 仓库 `github.com/itmanyong/slux`（`packages/react`）。
- 📚 问题反馈：[GitHub Issues](https://github.com/itmanyong/slux/issues)。

<!-- package-navigation:start -->

## 包导航

### 核心层

响应式运行时与零依赖工具，其余各层都建立在 core 之上。

| 📦 包名                                                                       | 版本                                                                                                                                                                                                                                  | 文档                                                     | 功能                   |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------- |
| [`@slux/core`](https://github.com/itmanyong/slux/tree/main/packages/core)     | [![npm version](https://img.shields.io/npm/v/@slux/core)](https://www.npmjs.com/package/@slux/core) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/core?label=npmx)](https://npmx.dev/package/@slux/core)         | [文档](https://itmanyong.github.io/slux/packages/core)   | 框架无关的响应式运行时 |
| [`@slux/shared`](https://github.com/itmanyong/slux/tree/main/packages/shared) | [![npm version](https://img.shields.io/npm/v/@slux/shared)](https://www.npmjs.com/package/@slux/shared) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/shared?label=npmx)](https://npmx.dev/package/@slux/shared) | [文档](https://itmanyong.github.io/slux/packages/shared) | 零依赖的共享工具       |

### 范式层

六种组织状态的方式，共享 core 的运行时，可在同一个依赖图中混用。

| 📦 包名                                                                                     | 版本                                                                                                                                                                                                                                                              | 文档                                                            | 功能                               |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------- |
| [`@slux/store`](https://github.com/itmanyong/slux/tree/main/packages/store)                 | [![npm version](https://img.shields.io/npm/v/@slux/store)](https://www.npmjs.com/package/@slux/store) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/store?label=npmx)](https://npmx.dev/package/@slux/store)                                 | [文档](https://itmanyong.github.io/slux/packages/store)         | 状态与 action 集中管理，支持中间件 |
| [`@slux/atom`](https://github.com/itmanyong/slux/tree/main/packages/atom)                   | [![npm version](https://img.shields.io/npm/v/@slux/atom)](https://www.npmjs.com/package/@slux/atom) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/atom?label=npmx)](https://npmx.dev/package/@slux/atom)                                     | [文档](https://itmanyong.github.io/slux/packages/atom)          | 细粒度原子状态与派生               |
| [`@slux/proxy`](https://github.com/itmanyong/slux/tree/main/packages/proxy)                 | [![npm version](https://img.shields.io/npm/v/@slux/proxy)](https://www.npmjs.com/package/@slux/proxy) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/proxy?label=npmx)](https://npmx.dev/package/@slux/proxy)                                 | [文档](https://itmanyong.github.io/slux/packages/proxy)         | 可变代理写入与只读快照             |
| [`@slux/flux`](https://github.com/itmanyong/slux/tree/main/packages/flux)                   | [![npm version](https://img.shields.io/npm/v/@slux/flux)](https://www.npmjs.com/package/@slux/flux) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/flux?label=npmx)](https://npmx.dev/package/@slux/flux)                                     | [文档](https://itmanyong.github.io/slux/packages/flux)          | reducer + dispatch 范式            |
| [`@slux/state-machine`](https://github.com/itmanyong/slux/tree/main/packages/state-machine) | [![npm version](https://img.shields.io/npm/v/@slux/state-machine)](https://www.npmjs.com/package/@slux/state-machine) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/state-machine?label=npmx)](https://npmx.dev/package/@slux/state-machine) | [文档](https://itmanyong.github.io/slux/packages/state-machine) | 平面有限状态机                     |
| [`@slux/rxjs`](https://github.com/itmanyong/slux/tree/main/packages/rxjs)                   | [![npm version](https://img.shields.io/npm/v/@slux/rxjs)](https://www.npmjs.com/package/@slux/rxjs) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/rxjs?label=npmx)](https://npmx.dev/package/@slux/rxjs)                                     | [文档](https://itmanyong.github.io/slux/packages/rxjs)          | Observable 与状态双向桥接          |

### 中间件层

挂载到 Store 的横切能力，五个包共用同一套契约。

| 📦 包名                                                                             | 版本                                                                                                                                                                                                                                              | 文档                                                        | 功能                 |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------- |
| [`@slux/storage`](https://github.com/itmanyong/slux/tree/main/packages/storage)     | [![npm version](https://img.shields.io/npm/v/@slux/storage)](https://www.npmjs.com/package/@slux/storage) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/storage?label=npmx)](https://npmx.dev/package/@slux/storage)         | [文档](https://itmanyong.github.io/slux/packages/storage)   | 状态持久化与恢复     |
| [`@slux/history`](https://github.com/itmanyong/slux/tree/main/packages/history)     | [![npm version](https://img.shields.io/npm/v/@slux/history)](https://www.npmjs.com/package/@slux/history) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/history?label=npmx)](https://npmx.dev/package/@slux/history)         | [文档](https://itmanyong.github.io/slux/packages/history)   | 撤销与重做           |
| [`@slux/tab-sync`](https://github.com/itmanyong/slux/tree/main/packages/tab-sync)   | [![npm version](https://img.shields.io/npm/v/@slux/tab-sync)](https://www.npmjs.com/package/@slux/tab-sync) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/tab-sync?label=npmx)](https://npmx.dev/package/@slux/tab-sync)     | [文档](https://itmanyong.github.io/slux/packages/tab-sync)  | 跨标签页状态同步     |
| [`@slux/telemetry`](https://github.com/itmanyong/slux/tree/main/packages/telemetry) | [![npm version](https://img.shields.io/npm/v/@slux/telemetry)](https://www.npmjs.com/package/@slux/telemetry) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/telemetry?label=npmx)](https://npmx.dev/package/@slux/telemetry) | [文档](https://itmanyong.github.io/slux/packages/telemetry) | 状态变化与订阅遥测   |
| [`@slux/devtools`](https://github.com/itmanyong/slux/tree/main/packages/devtools)   | [![npm version](https://img.shields.io/npm/v/@slux/devtools)](https://www.npmjs.com/package/@slux/devtools) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/devtools?label=npmx)](https://npmx.dev/package/@slux/devtools)     | [文档](https://itmanyong.github.io/slux/packages/devtools)  | 调试工具、日志与检查 |

### 框架层

十二个绑定包都提供 core 主入口与六个范式子入口，使用框架原生响应式与生命周期。范式包是**可选** peer，只装实际使用的；`@slux/core` 与框架本身是**必需** peer。

| 📦 包名                                                                         | 版本                                                                                                                                                                                                                                      | 文档                                                      | 适配框架                                        | 适配版本                  |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------- | ------------------------- |
| [`@slux/react`](https://github.com/itmanyong/slux/tree/main/packages/react)     | [![npm version](https://img.shields.io/npm/v/@slux/react)](https://www.npmjs.com/package/@slux/react) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/react?label=npmx)](https://npmx.dev/package/@slux/react)         | [文档](https://itmanyong.github.io/slux/packages/react)   | [React](https://github.com/react/react)         | `^18.0.0 ‖ ^19.0.0`       |
| [`@slux/vue`](https://github.com/itmanyong/slux/tree/main/packages/vue)         | [![npm version](https://img.shields.io/npm/v/@slux/vue)](https://www.npmjs.com/package/@slux/vue) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/vue?label=npmx)](https://npmx.dev/package/@slux/vue)                 | [文档](https://itmanyong.github.io/slux/packages/vue)     | [Vue](https://github.com/vuejs/core)            | `>= 3.2.0`                |
| [`@slux/solid`](https://github.com/itmanyong/slux/tree/main/packages/solid)     | [![npm version](https://img.shields.io/npm/v/@slux/solid)](https://www.npmjs.com/package/@slux/solid) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/solid?label=npmx)](https://npmx.dev/package/@slux/solid)         | [文档](https://itmanyong.github.io/slux/packages/solid)   | [Solid](https://github.com/solidjs/solid)       | `>= 1.0.0`                |
| [`@slux/svelte`](https://github.com/itmanyong/slux/tree/main/packages/svelte)   | [![npm version](https://img.shields.io/npm/v/@slux/svelte)](https://www.npmjs.com/package/@slux/svelte) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/svelte?label=npmx)](https://npmx.dev/package/@slux/svelte)     | [文档](https://itmanyong.github.io/slux/packages/svelte)  | [Svelte](https://github.com/sveltejs/svelte)    | `>= 4.0.0`                |
| [`@slux/angular`](https://github.com/itmanyong/slux/tree/main/packages/angular) | [![npm version](https://img.shields.io/npm/v/@slux/angular)](https://www.npmjs.com/package/@slux/angular) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/angular?label=npmx)](https://npmx.dev/package/@slux/angular) | [文档](https://itmanyong.github.io/slux/packages/angular) | [Angular](https://github.com/angular/angular)   | `@angular/core >= 16.0.0` |
| [`@slux/preact`](https://github.com/itmanyong/slux/tree/main/packages/preact)   | [![npm version](https://img.shields.io/npm/v/@slux/preact)](https://www.npmjs.com/package/@slux/preact) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/preact?label=npmx)](https://npmx.dev/package/@slux/preact)     | [文档](https://itmanyong.github.io/slux/packages/preact)  | [Preact](https://github.com/preactjs/preact)    | `>= 10.5.0`               |
| [`@slux/ripple`](https://github.com/itmanyong/slux/tree/main/packages/ripple)   | [![npm version](https://img.shields.io/npm/v/@slux/ripple)](https://www.npmjs.com/package/@slux/ripple) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/ripple?label=npmx)](https://npmx.dev/package/@slux/ripple)     | [文档](https://itmanyong.github.io/slux/packages/ripple)  | [Ripple](https://github.com/Ripple-TS/ripple)   | `>= 0.6.0`                |
| [`@slux/inferno`](https://github.com/itmanyong/slux/tree/main/packages/inferno) | [![npm version](https://img.shields.io/npm/v/@slux/inferno)](https://www.npmjs.com/package/@slux/inferno) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/inferno?label=npmx)](https://npmx.dev/package/@slux/inferno) | [文档](https://itmanyong.github.io/slux/packages/inferno) | [Inferno](https://github.com/infernojs/inferno) | `>= 7.0.0`                |
| [`@slux/octane`](https://github.com/itmanyong/slux/tree/main/packages/octane)   | [![npm version](https://img.shields.io/npm/v/@slux/octane)](https://www.npmjs.com/package/@slux/octane) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/octane?label=npmx)](https://npmx.dev/package/@slux/octane)     | [文档](https://itmanyong.github.io/slux/packages/octane)  | [Octane](https://github.com/octanejs/octane)    | `>= 0.16.0`               |
| [`@slux/vitarx`](https://github.com/itmanyong/slux/tree/main/packages/vitarx)   | [![npm version](https://img.shields.io/npm/v/@slux/vitarx)](https://www.npmjs.com/package/@slux/vitarx) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/vitarx?label=npmx)](https://npmx.dev/package/@slux/vitarx)     | [文档](https://itmanyong.github.io/slux/packages/vitarx)  | [Vitarx](https://github.com/vitarx-lib/core)    | `>= 4.0.0`                |
| [`@slux/actview`](https://github.com/itmanyong/slux/tree/main/packages/actview) | [![npm version](https://img.shields.io/npm/v/@slux/actview)](https://www.npmjs.com/package/@slux/actview) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/actview?label=npmx)](https://npmx.dev/package/@slux/actview) | [文档](https://itmanyong.github.io/slux/packages/actview) | [ActView](https://github.com/actview/actview)   | `>= 1.0.0`                |
| [`@slux/viewfly`](https://github.com/itmanyong/slux/tree/main/packages/viewfly) | [![npm version](https://img.shields.io/npm/v/@slux/viewfly)](https://www.npmjs.com/package/@slux/viewfly) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/viewfly?label=npmx)](https://npmx.dev/package/@slux/viewfly) | [文档](https://itmanyong.github.io/slux/packages/viewfly) | [Viewfly](https://github.com/viewfly/viewfly)   | `>= 3.0.0`                |

格式差异：**Octane** 的公开入口是 TypeScript 源码，需消费端 Octane 编译器处理且不提供 CJS；**Ripple** 只发布 ESM，另有 `./server` 服务端入口。其余边界见各包文档。

### 插件层

**规划中**

| 包名 | 版本 | 文档 | 功能 |
| ---- | ---- | ---- | ---- |
| —    | —    | —    | —    |

<!-- package-navigation:end -->
