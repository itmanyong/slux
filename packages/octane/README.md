# @slux/octane

🔌 为独立的 Octane UI 框架（npm 包 `octane`，peer 为 `^0.16.7`）提供基于**编译器 slot hooks** 的原生绑定。读取绑定通过 `useSyncExternalStore` **直接返回值 `T`**（不是 ref、Accessor 或 `.value`），写入仍走原实例。与其余框架适配包最根本的不同：本包 `exports` 全部指向 **`./src/*.ts` TypeScript 源码**，不是预编译产物，且**不提供 CommonJS 入口**。

[![GITHUB](https://img.shields.io/badge/GITHUB-181717?style=for-the-badge&logo=github&logoColor=white&color=green)](https://github.com/itmanyong/slux/tree/main/packages/octane) [![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white&color=orange)](https://www.npmjs.com/package/@slux/octane) [![文档](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E6%96%87%E6%A1%A3-0F766E?style=for-the-badge&color=blue)](https://itmanyong.github.io/slux/packages/octane/)

> 💡 **前置条件（务必先读）**：消费端必须接入 Octane 官方编译器 / 构建插件（配合 `package.json` 的 `octane.hookSlots.manual: ["src"]`）来编译本包与调用方组件，编译器为每个 hook 调用点分配 slot。**不支持**把这些源文件直接交给普通 JSX/TS 编译器后运行。详见「前置条件与编译产物」。

## 特性与适用场景

| 🧭 场景                                                      | 是否适用 | 说明                        |
| ------------------------------------------------------------ | -------- | --------------------------- |
| 已接入 Octane 官方编译器的项目读取 core 状态                 | 适用     | `useSignal` 直接返回值 `T`  |
| 需要编译器 slot hooks 自动分配调用位置                       | 适用     | 组件内无需手工传 `slot`     |
| SSR 由工具链把 runtime 切到 `octane/server`                  | 适用     | `renderToString` 不建立订阅 |
| 接入 atom / store / proxy / flux / state-machine / rxjs 范式 | 适用     | 各子入口，返回值均为直接值  |
| 只想把 `.ts` 源码交给普通 JSX/TS 编译器直接运行              | 不适用   | 必须经 Octane 编译器        |
| 需要 CJS（`require`）入口                                    | 不适用   | 只有源码 ESM 入口           |
| 需要可写容器、`ref.set`、双向绑定 ref                        | 不适用   | 返回值是纯值，写入走原实例  |
| 需要自动请求级隔离、自动 SSR 序列化 / 恢复                   | 不适用   | 沿用 core 显式覆盖语义      |

## 安装

```sh
pnpm add @slux/core @slux/octane octane
```

- `@slux/core`（`workspace:^`）与 `octane`（`^0.16.7`）是**必需 peer**；`@slux/shared` 是运行时依赖，会随包带入。
- **范式包是可选 peer，只装实际使用的**：`@slux/atom`、`@slux/store`、`@slux/proxy`、`@slux/flux`、`@slux/state-machine`、`@slux/rxjs`（均为 `workspace:^`，`peerDependenciesMeta` 标为 `optional`）。
- `exports` 全部是 `./src/*.ts` 源码路径，`main` / `module` / `types` 同为 `./src/index.ts`，`files` 包含 `src`；没有 `import` / `require` 条件区分，也没有 CJS 产物。`dist` 只有 ESM 构建产物供检查，**公开入口以 `src` 为准**。
- 消费端还需能编译本包的 Octane 编译器（见下节）。

`exports` 子入口逐个对应：

| 📦 子入口                    | 所需范式 peer         | 主要导出                                                                                                              |
| ---------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `@slux/octane`               | `@slux/core`          | `useSignal`、`ScopeContext`、`ScopeProvider`、`useScopeContext`、`ScopeProviderProps`（类型）、`createAutoImportApis` |
| `@slux/octane/atom`          | `@slux/atom`          | `useAtom`、`useAtomValue`、`useSetAtom`                                                                               |
| `@slux/octane/store`         | `@slux/store`         | `useStore`                                                                                                            |
| `@slux/octane/proxy`         | `@slux/proxy`         | `useSnapshot`                                                                                                         |
| `@slux/octane/flux`          | `@slux/flux`          | `useFluxStore`                                                                                                        |
| `@slux/octane/state-machine` | `@slux/state-machine` | `useMachine`                                                                                                          |
| `@slux/octane/rxjs`          | `@slux/rxjs`          | `useObservable`                                                                                                       |
| `@slux/octane/package.json`  | —                     | 包元信息                                                                                                              |

## 快速开始

🚀 组件文件由消费端 Octane 编译器处理，编译器自动为每个 hook 调用点分配 slot：

```tsx
// Counter.tsx —— 由消费端 Octane 编译器编译
import { signal } from "@slux/core";
import { useSignal } from "@slux/octane";
import { atom } from "@slux/atom";
import { useAtom } from "@slux/octane/atom";

const count = signal(0);
const title = atom("hello");

export function Counter() {
  const value = useSignal(count); // number：直接是值，不是 ref / accessor
  const [text, setText] = useAtom(title); // [string, (value: string) => void]
  return <output>{`${text}:${value}`}</output>;
}

// 写入仍走原实例 / 返回的 setter（可放在事件回调或外部 action 中）：
count.set((n) => n + 1);
setText("world");
```

直接使用**未编译的原生 runtime** 编写时，需要给每个调用点传入独立、稳定的 `symbol` 作为最后一项参数：

```ts
const slot = Symbol("counter");
const value = useSignal(count, slot); // T
```

## 前置条件与编译产物

- **源码即入口**：`exports` 直接指向 `./src/index.ts`、`./src/atom.ts` 等；`dist` 仅保留 ESM 构建产物供检查，不作为公开入口，且**不提供 CJS**。
- **hookSlots 声明**：`package.json` 的 `octane.hookSlots.manual: ["src"]` 让编译器把本包纳入 slot 编译。
- **slot 派生**：`src/slots.ts` 定义 `subSlot = createSubSlot({ tagPrefix: ":slux:", slotlessPrefix: "@slux/octane:", global: false })`。编译器给每个调用点分配 slot，内部子 hook 用 `subSlot(slot, "signal:subscribe")`、`"signal:read"`、`"signal:server"`、`"signal:value"` 等派生各自位置，避免相互覆盖。公开 API 的 `slot?: symbol` 是**最后一项可选参数**，编译后由编译器注入。
- **SSR 工具链**：服务端由工具链把 `octane` runtime 导入切换为 `octane/server`（`renderToString` 来自 `octane/server`），编译器按 client / server 模式处理组件；`octane/compiler` 的 `compile` 负责生成对应代码。
- **未编译 runtime**：若不经过编译器、直接在原生 runtime 上调用，必须为每个调用点传独立、稳定的 `symbol`，否则子 hook 位置会冲突。

## 主入口 API

| 🧭 API                 | 签名                                               | 说明                                                                           |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| `useSignal`            | `<T>(source: Subscribable<T>, slot?: symbol) => T` | 用 `useSyncExternalStore` 桥接，直接返回值 `T`                                 |
| `ScopeProvider`        | `({ scope, children }: ScopeProviderProps)`        | 用 `createElement(ScopeContext, { value: scope, children })` 提供 core `Scope` |
| `ScopeContext`         | `createContext<Scope \| null>(null)` 的结果        | 原生注入上下文，默认值 `null`                                                  |
| `useScopeContext`      | `() => Scope \| null`                              | `useContext(ScopeContext)`，无提供时返回 `null`                                |
| `createAutoImportApis` | `(prefix?: string) => ImportsMap`                  | 生成自动导入配置，见「自动导入」                                               |

🧭 `useSignal` 内部由四个带 `subSlot` 的 hook 组成，行为如下：

| 🧭 维度        | 行为                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 读取           | `getSnapshot = () => source.get()`，返回**客户端全局值**                                                                                |
| **服务端快照** | `getServerSnapshot = () => (scope ? scope.get(source) : source.get())`，存在 `ScopeProvider` 时经 `scope.get` 读取                      |
| 订阅           | `useCallback([source])` 内 `source.subscribe(notify)` + core `effect(() => source.get())` 驱动惰性 computed；返回同时释放两者的清理函数 |
| slot 派生      | `signal:subscribe` / `signal:read` / `signal:server` / `signal:value` 由 `subSlot` 派生                                                 |
| 来源切换       | `useCallback` 依赖 `[source]`，切换 `source` 会清除旧订阅、重建读取                                                                     |
| 相等判定       | **不暴露 `equals` 参数**；快照变化由 `useSyncExternalStore` 依据 `getSnapshot()` 返回值判定                                             |

## 子入口 API

🧭 所有读取绑定都**直接返回值**，写入一律通过原实例；每个 API 都带 `slot?: symbol` 末位参数。`/atom`、`/store`、`/proxy` 的 `getServerSnapshot` 等于 `getSnapshot`（不读 Scope）。

### `@slux/octane/atom`

| 💡 API         | 签名                                                           | 返回值         | 写入方式                                    |
| -------------- | -------------------------------------------------------------- | -------------- | ------------------------------------------- |
| `useAtom`      | `<T>(atom: Atom<T>, slot?: symbol) => [T, (value: T) => void]` | `[值, setter]` | setter 直接调用 `atom.set(value)`           |
| `useAtomValue` | `<T>(atom: AnyReadableAtom<T>, slot?: symbol) => T`            | 值 `T`         | 只读；可写派生 atom 通过原 `atom.write`     |
| `useSetAtom`   | `<T>(atom: Atom<T>, slot?: symbol) => (value: T) => void`      | setter         | `atom.set(value)`，函数值不会被当成 updater |

三者用 `useSyncExternalStore(subscribe, getSnapshot, getSnapshot, …)`，子 hook 位置由 `subSlot(slot, "atom:…")` 派生。

### `@slux/octane/store`

```ts
useStore<State extends object>(store: StoreApi<State>, slot?: symbol): State;
useStore<State extends object, Selection>(
  store: StoreApi<State>,
  selector: (state: State) => Selection,
  equalityFn?: (previous: Selection, next: Selection) => boolean,
  slot?: symbol,
): Selection;
```

- `slot` 是「最后一项参数」，可落在第 2 / 3 / 4 个位置，实现用 `typeof arg === "symbol"` 辨识出真正的 slot、`selector` 与 `equalityFn`。
- `getSnapshot` 由 `useMemo` 构建并缓存 `{ state, selection }`：`Object.is(cache.state, state)` 时直接返回缓存；否则 `equalityFn(cache.selection, next)` 为 `true` 时保留旧引用。`equalityFn` 默认 `Object.is`。
- 写入走 `store.setState`；`getServerSnapshot = getSnapshot`，不读 Scope。

### `@slux/octane/proxy`

`useSnapshot<T extends object>(proxy: T, slot?: symbol): Snapshot<T>`：返回**冻结且结构共享**的快照，订阅整个 proxy 及嵌套变化；通过原 proxy 对象修改状态。

### `@slux/octane/flux`

`useFluxStore<State, Action extends { type: string }>(store: FluxStore<State, Action>, slot?: symbol): State`，等价于 `useSignal(store, slot)`。写入仍通过 `store.dispatch(action)`。

### `@slux/octane/state-machine`

`useMachine<Context, Event extends { type: string }, State extends string>(machine: StateMachine<Context, Event, State>, slot?: symbol): MachineSnapshot<Context, State>`，等价于 `useSignal(machine, slot)`。写入通过 `machine.send(event)`；返回的是快照对象，状态名与上下文分别读作 `snapshot.value`、`snapshot.context`。

### `@slux/octane/rxjs`

`useObservable<T>(source: ObservableState<T>, slot?: symbol): T`，等价于 `useSignal(source, slot)`。写入通过上游 Observable / Subject；`status` / `error` 从来源读取，`dispose()` 由桥接创建者负责。

> 💡 `/flux`、`/state-machine`、`/rxjs` 复用 `useSignal`，因此它们的服务端快照同样经过 `scope.get(source)`；但 core 的 `scope.set` 要求 `Signal<T>`，范式实例不提供 `set`，所以对这些实例无法建立 Scope 覆盖，服务端读到的仍是 `scope.get` 回退后的来源当前值。

## 专属语义与边界

- **SSR / hydration**：`renderToString` 来自 `octane/server`（由工具链切换 runtime 导入），**不建立任何组件订阅**（`subscribe` 不被调用），也不改写全局 signal。只有主入口 `useSignal`（及复用它的三个新范式）的服务端快照在存在 `ScopeProvider` 时走 `scope.get(source)`；`/atom`、`/store`、`/proxy` 的 `getServerSnapshot` 直接等于 `getSnapshot`，不隐式使用 core Scope。服务端不自动序列化、传输或恢复状态，SSR 与上下文的通用约定见仓库根 [README](../../README.md) 的「框架适配 · 通用约定」。
- **Scope**：用 `<ScopeProvider scope={scope}>` 提供，后代 `useScopeContext()` 返回 `Scope | null`；`ScopeContext` 可用于原生注入配置。客户端 `getSnapshot` 始终读 `source.get()`，Scope **不改变客户端全局值**。Scope 沿用 core 的**显式覆盖**语义，`runInScope` 不改写全局 signal 读写。
- **订阅与清理**：订阅与惰性 computed 的 core `effect` 由 `useSyncExternalStore` 管理；`useCallback` / `useMemo` 的依赖（`[source]`、`[store, selector, equalityFn]`、`[atom]`、`[proxy]`）保证切换来源时清除旧订阅、重建读取。`root.unmount()` 释放所有订阅与 effect；卸载只解除**组件自身**绑定，flux / machine / observable 原实例不随之销毁，`dispose()` 由调用方负责。
- **快照相等判定**：`useSignal` 无 `equals` 参数；`useStore` 的 `equalityFn` 默认 `Object.is`，相等时保留旧选择结果引用，并用 `useMemo` 缓存保证 `getSnapshot` 返回稳定值；proxy 快照冻结、未修改分支保持原引用。
- **错误处理**：绑定层不额外捕获异常、不吞错、不回滚写入；`source.get` / `subscribe` / core `effect` 抛出的错误按 `@slux/core` 的语义传播。

## 自动导入

🔌 `createAutoImportApis(prefix?)` 基于 `@slux/shared` 的 `generateBatchAutoImports` 返回 `unplugin-auto-import` 的 `ImportsMap`，来源名为 `@slux/octane`。登记清单（取自 `src/auto-import-api.ts` 的 `allImportApis`）：

`ScopeContext`、`ScopeProvider`、`useScopeContext`、`useSignal`

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/octane";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

传入前缀会为登记项生成别名；前缀以小写字母结尾时 API 名首字母大写，规则由 `@slux/shared` 的 `createAutoImports` 统一决定。`ScopeProviderProps` 是纯类型，不在登记清单中。

## 类型导出

💡 主入口 `src/index.ts` 唯一 re-export 的类型是 `ScopeProviderProps`（`{ readonly scope: Scope; readonly children?: OctaneNode }`）；各子入口不 re-export 类型。其余类型从来源包导入：

| 💡 用到的类型                     | 来源                     |
| --------------------------------- | ------------------------ |
| `ScopeProviderProps`              | `@slux/octane`（主入口） |
| `Subscribable<T>`、`Scope`        | `@slux/core`             |
| `OctaneNode`                      | `octane`                 |
| `Atom<T>`、`AnyReadableAtom<T>`   | `@slux/atom`             |
| `StoreApi<T>`                     | `@slux/store`            |
| `Snapshot<T>`                     | `@slux/proxy`            |
| `FluxStore`                       | `@slux/flux`             |
| `MachineSnapshot`、`StateMachine` | `@slux/state-machine`    |
| `ObservableState<T>`              | `@slux/rxjs`             |

## 不适用的场景

- 未接入 Octane 官方编译器、只想把 `.ts` 当普通 TSX 编译后运行：不支持，slot 无法分配。
- 需要 CJS / `require` 入口：本包不提供。
- 需要可写容器或在绑定上直接 `set`：返回值是纯值，请用原实例写入。
- 用未编译的原生 runtime 却不愿为每处调用传稳定 `symbol`：子 hook 位置会冲突。
- 需要框架自动做请求级状态隔离或 SSR 状态恢复：需按 core 的 `Scope` 与服务端约定自行实现。

## 版本、许可与反馈

- 版本：`0.2.4`（`package.json`）。
- 许可：MIT，见仓库根 [LICENSE](../../LICENSE)。
- 问题反馈：通过 [issues](https://github.com/itmanyong/slux/issues) 提交（`package.json` `repository`）。
- 通用约定（子入口分布、写入方式、桥接生命周期、Scope、SSR）与本地开发命令见仓库根 [README](../../README.md) 的「框架适配 · 通用约定」与「本地开发」，本文不重复。

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

| 📦 包名                                                                         | 版本                                                                                                                                                                                                                                      | 文档                                                      | 适配框架                                        | 适配版本                                   |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------ |
| [`@slux/react`](https://github.com/itmanyong/slux/tree/main/packages/react)     | [![npm version](https://img.shields.io/npm/v/@slux/react)](https://www.npmjs.com/package/@slux/react) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/react?label=npmx)](https://npmx.dev/package/@slux/react)         | [文档](https://itmanyong.github.io/slux/packages/react)   | [React](https://github.com/react/react)         | `^18.0.0 ‖ ^19.0.0`                        |
| [`@slux/vue`](https://github.com/itmanyong/slux/tree/main/packages/vue)         | [![npm version](https://img.shields.io/npm/v/@slux/vue)](https://www.npmjs.com/package/@slux/vue) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/vue?label=npmx)](https://npmx.dev/package/@slux/vue)                 | [文档](https://itmanyong.github.io/slux/packages/vue)     | [Vue](https://github.com/vuejs/core)            | `>= 3.2.0`                                 |
| [`@slux/solid`](https://github.com/itmanyong/slux/tree/main/packages/solid)     | [![npm version](https://img.shields.io/npm/v/@slux/solid)](https://www.npmjs.com/package/@slux/solid) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/solid?label=npmx)](https://npmx.dev/package/@slux/solid)         | [文档](https://itmanyong.github.io/slux/packages/solid)   | [Solid](https://github.com/solidjs/solid)       | `>= 1.0.0`                                 |
| [`@slux/svelte`](https://github.com/itmanyong/slux/tree/main/packages/svelte)   | [![npm version](https://img.shields.io/npm/v/@slux/svelte)](https://www.npmjs.com/package/@slux/svelte) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/svelte?label=npmx)](https://npmx.dev/package/@slux/svelte)     | [文档](https://itmanyong.github.io/slux/packages/svelte)  | [Svelte](https://github.com/sveltejs/svelte)    | `>= 4.0.0`                                 |
| [`@slux/angular`](https://github.com/itmanyong/slux/tree/main/packages/angular) | [![npm version](https://img.shields.io/npm/v/@slux/angular)](https://www.npmjs.com/package/@slux/angular) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/angular?label=npmx)](https://npmx.dev/package/@slux/angular) | [文档](https://itmanyong.github.io/slux/packages/angular) | [Angular](https://github.com/angular/angular)   | `@angular/core >= 16.0.0`、`rxjs >= 7.8.0` |
| [`@slux/preact`](https://github.com/itmanyong/slux/tree/main/packages/preact)   | [![npm version](https://img.shields.io/npm/v/@slux/preact)](https://www.npmjs.com/package/@slux/preact) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/preact?label=npmx)](https://npmx.dev/package/@slux/preact)     | [文档](https://itmanyong.github.io/slux/packages/preact)  | [Preact](https://github.com/preactjs/preact)    | `>= 10.5.0`                                |
| [`@slux/ripple`](https://github.com/itmanyong/slux/tree/main/packages/ripple)   | [![npm version](https://img.shields.io/npm/v/@slux/ripple)](https://www.npmjs.com/package/@slux/ripple) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/ripple?label=npmx)](https://npmx.dev/package/@slux/ripple)     | [文档](https://itmanyong.github.io/slux/packages/ripple)  | [Ripple](https://github.com/Ripple-TS/ripple)   | `>= 0.6.0`                                 |
| [`@slux/inferno`](https://github.com/itmanyong/slux/tree/main/packages/inferno) | [![npm version](https://img.shields.io/npm/v/@slux/inferno)](https://www.npmjs.com/package/@slux/inferno) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/inferno?label=npmx)](https://npmx.dev/package/@slux/inferno) | [文档](https://itmanyong.github.io/slux/packages/inferno) | [Inferno](https://github.com/infernojs/inferno) | `>= 7.0.0`                                 |
| [`@slux/octane`](https://github.com/itmanyong/slux/tree/main/packages/octane)   | [![npm version](https://img.shields.io/npm/v/@slux/octane)](https://www.npmjs.com/package/@slux/octane) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/octane?label=npmx)](https://npmx.dev/package/@slux/octane)     | [文档](https://itmanyong.github.io/slux/packages/octane)  | [Octane](https://github.com/octanejs/octane)    | `>= 0.16.0`                                |
| [`@slux/vitarx`](https://github.com/itmanyong/slux/tree/main/packages/vitarx)   | [![npm version](https://img.shields.io/npm/v/@slux/vitarx)](https://www.npmjs.com/package/@slux/vitarx) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/vitarx?label=npmx)](https://npmx.dev/package/@slux/vitarx)     | [文档](https://itmanyong.github.io/slux/packages/vitarx)  | [Vitarx](https://github.com/vitarx-lib/core)    | `>= 4.0.0`                                 |
| [`@slux/actview`](https://github.com/itmanyong/slux/tree/main/packages/actview) | [![npm version](https://img.shields.io/npm/v/@slux/actview)](https://www.npmjs.com/package/@slux/actview) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/actview?label=npmx)](https://npmx.dev/package/@slux/actview) | [文档](https://itmanyong.github.io/slux/packages/actview) | [ActView](https://github.com/actview/actview)   | `>= 1.0.0`                                 |
| [`@slux/viewfly`](https://github.com/itmanyong/slux/tree/main/packages/viewfly) | [![npm version](https://img.shields.io/npm/v/@slux/viewfly)](https://www.npmjs.com/package/@slux/viewfly) [![npmx version](https://npmx.dev/api/registry/badge/version/@slux/viewfly?label=npmx)](https://npmx.dev/package/@slux/viewfly) | [文档](https://itmanyong.github.io/slux/packages/viewfly) | [Viewfly](https://github.com/viewfly/viewfly)   | `>= 3.0.0`                                 |

格式差异：**Octane** 的公开入口是 TypeScript 源码，需消费端 Octane 编译器处理且不提供 CJS；**Ripple** 只发布 ESM，另有 `./server` 服务端入口。其余边界见各包文档。

### 插件层

**规划中**

| 包名 | 版本 | 文档 | 功能 |
| ---- | ---- | ---- | ---- |
| —    | —    | —    | —    |

<!-- package-navigation:end -->
