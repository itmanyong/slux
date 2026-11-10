# @slux/viewfly

🔌 把 `@slux/core` 及 6 个范式包的状态接入 **Viewfly 3**（peer 为 `@viewfly/core ^3.0.6`）。读取绑定统一以 **Accessor**（`Accessor<T> = () => T`，**调用函数**读取）暴露，写入始终走原实例，绑定不提供 setter 也不创建副本。与其它同构适配包的关键差别：Viewfly 版基于 `@viewfly/core` 的 `createSignal`，在 `onMounted` 的**下一微任务**才建立订阅以避开挂载阶段重置更新标记，且不要求原生 effect scope。本包提供 **ESM + CJS** 双入口。

[![GITHUB](https://img.shields.io/badge/GITHUB-181717?style=for-the-badge&logo=github&logoColor=white&color=green)](https://github.com/itmanyong/slux/tree/main/packages/viewfly) [![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white&color=orange)](https://www.npmjs.com/package/@slux/viewfly) [![文档](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E6%96%87%E6%A1%A3-0F766E?style=for-the-badge&color=blue)](https://itmanyong.github.io/slux/packages/viewfly/)

## 特性与适用场景

| 🧭 场景                                                                  | 是否适用 | 说明                                         |
| ------------------------------------------------------------------------ | -------- | -------------------------------------------- |
| 在 Viewfly 3 组件内读取 `signal` / 惰性 `computed` / 任意 `Subscribable` | 适用     | `useSignal` 返回 `Accessor<T>`               |
| 在返回的渲染函数里调用 `accessor()` 追踪更新                             | 适用     | 值由 `createSignal` 承载，按引用判定变化     |
| 接入 atom / store / proxy / flux / state-machine / rxjs 范式             | 适用     | 各用对应子入口                               |
| 一次性 HTML 渲染（`autoUpdate: false`）输出初始快照                      | 适用     | 微任务订阅前销毁不残留订阅                   |
| 需要可写 Accessor、`accessor.set`、双向绑定 tuple                        | 不适用   | `Accessor` 不暴露 `set`，写入走原实例        |
| 期望绑定创建瞬间就完成订阅                                               | 不适用   | 订阅推迟到 `onMounted` 的下一微任务          |
| 需要自动请求级隔离、自动 SSR 序列化 / 恢复                               | 不适用   | 沿用 core 显式覆盖语义，见「专属语义与边界」 |

## 安装

```sh
pnpm add @slux/core @slux/viewfly @viewfly/core
```

- `@slux/core`（`workspace:^`）与 `@viewfly/core`（`^3.0.6`）是**必需 peer**；`@slux/shared` 是运行时依赖，会随包带入。
- **范式包是可选 peer，只装实际使用的**：`@slux/atom`、`@slux/store`、`@slux/proxy`、`@slux/flux`、`@slux/state-machine`、`@slux/rxjs`（均为 `workspace:^`，`peerDependenciesMeta` 标为 `optional`）。
- `exports` 同时含 `import` 与 `require` 条件，提供 ESM（`.js` / `.d.ts`）与 CJS（`.cjs` / `.d.cts`）产物。

`exports` 子入口逐个对应：

| 📦 子入口                     | 所需范式 peer         | 主要导出                                                                                           |
| ----------------------------- | --------------------- | -------------------------------------------------------------------------------------------------- |
| `@slux/viewfly`               | `@slux/core`          | `useSignal`、`ScopeProvider`、`SLUX_SCOPE`、`useScope`、`createAutoImportApis`、`Accessor`（类型） |
| `@slux/viewfly/atom`          | `@slux/atom`          | `useAtomValue`、`useSetAtom`、`useAtom`                                                            |
| `@slux/viewfly/store`         | `@slux/store`         | `useStore`                                                                                         |
| `@slux/viewfly/proxy`         | `@slux/proxy`         | `useSnapshot`                                                                                      |
| `@slux/viewfly/flux`          | `@slux/flux`          | `useFluxStore`                                                                                     |
| `@slux/viewfly/state-machine` | `@slux/state-machine` | `useMachine`                                                                                       |
| `@slux/viewfly/rxjs`          | `@slux/rxjs`          | `useObservable`                                                                                    |
| `@slux/viewfly/package.json`  | —                     | 包元信息                                                                                           |

> 💡 示例中的 `createApp` / `HTMLRenderer` / `VDOMElement` / `OutputTranslator` 来自框架配套包 `@viewfly/platform-browser`，不是本包 peer。

## 快速开始

```tsx
import { jsx } from "@viewfly/core";
import { createApp } from "@viewfly/platform-browser";
import { signal } from "@slux/core";
import { useSignal } from "@slux/viewfly";

const count = signal(1);

function Counter() {
  const read = useSignal(count); // Accessor<number> = () => number
  return () => jsx("span", { children: read() });
}

const container = document.createElement("div");
document.body.append(container);
const app = createApp(jsx(Counter, {})).mount(container);
count.set(5); // 写入走原 signal；Accessor 没有 set
app.destroy(); // 释放绑定订阅
```

🚀 订阅在挂载后的下一微任务建立，写入后的 DOM 更新由 Viewfly 的调度器（`nextTick`，或手动调度下调用 `app.render()`）驱动。读取绑定必须在组件初始化中创建，并在返回的渲染函数里调用 `read()` 才能被追踪。

## 主入口 API

| API                    | 签名                                                                         | 说明                                              |
| ---------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| `useSignal`            | `<T>(source: Subscribable<T>) => Accessor<T>`                                | 把任意可订阅源桥接为只读 Accessor                 |
| `ScopeProvider`        | Viewfly 原生 context provider 组件                                           | 通过 `useValue={scope}` 提供 core `Scope`         |
| `SLUX_SCOPE`           | `InjectionToken<Scope>`（`new InjectionToken<Scope>("slux.viewfly.scope")`） | 原生注入令牌                                      |
| `useScope`             | `() => Scope \| undefined`                                                   | 读取最近的 core `Scope`，无提供时返回 `undefined` |
| `createAutoImportApis` | `(prefix?: string) => ImportsMap`                                            | 生成自动导入配置，见「自动导入」                  |
| `Accessor<T>`          | `export type Accessor<T> = () => T`                                          | 读取函数类型，见「类型导出」                      |

🧭 `useSignal` 委托内部 `bindExternal(get, subscribe, equals)`，行为如下：

| 维度           | 行为                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 读取形式       | 调用 `accessor()`；底层是 `@viewfly/core` 的 `createSignal`，返回 `() => value()`                                                    |
| **订阅时机**   | `onMounted` 内用 `queueMicrotask` 在**下一微任务** `subscribe(update)` 并 `update()` 补读最新值，避开 Viewfly 挂载回调后重置更新标记 |
| **挂载前销毁** | 清理函数把 `active` 置 `false`，微任务不再建立订阅，不会留下残留订阅                                                                 |
| 惰性 computed  | 除 `source.subscribe(notify)` 外，另起 core `effect(() => source.get())` 保持依赖刷新                                                |
| 相等判定       | 默认 `Object.is`；用局部 `current` 比较，相等时不调用 `value.set`、保留旧引用                                                        |
| 清理           | `onMounted` 返回的清理函数在组件销毁（`app.destroy()`）时执行 `active = false` 与 `dispose?.()`                                      |
| **作用域要求** | **无 `getCurrentScope` 检查、不抛错**；订阅依赖 `onMounted` 生命周期，脱离组件初始化调用不会建立订阅                                 |
| 来源固定       | 绑定创建后 `source` / `selector` 固定，切换需重建组件                                                                                |

## 子入口 API

🧭 所有读取绑定都返回 **Accessor**（`() => …`），写入一律通过原实例。

### `@slux/viewfly/atom`

| API            | 签名                                                               | 返回值   | 写入方式                                             |
| -------------- | ------------------------------------------------------------------ | -------- | ---------------------------------------------------- |
| `useAtomValue` | `<T>(atom: ReadonlyAtom<T>) => Accessor<T>`                        | Accessor | 只读；可写派生 atom 通过原 `atom.write`              |
| `useSetAtom`   | `<T>(atom: Atom<T>) => (value: T) => void`                         | setter   | 直接调用 `atom.set(value)`，函数值不会被当成 updater |
| `useAtom`      | `<T>(atom: Atom<T>) => readonly [Accessor<T>, (value: T) => void]` | 二元组   | 同 `useSetAtom`                                      |

### `@slux/viewfly/store`

```ts
useStore<T>(store: StoreApi<T>): Accessor<T>;
useStore<T, S>(store: StoreApi<T>, selector: (state: T) => S, equals?: (a: S, b: S) => boolean): Accessor<S>;
```

`selector` 默认恒等、`equals` 默认 `Object.is`；比较器返回 `true` 时保留上一次结果引用。写入走 `store.setState`。

### `@slux/viewfly/proxy`

`useSnapshot<T extends object>(proxy: T): Accessor<Snapshot<T>>`：返回**冻结且结构共享**的快照，订阅整个 proxy 及嵌套变化；通过原 proxy 对象修改状态。

### `@slux/viewfly/flux`

`useFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Accessor<State>`，等价于 `useSignal(store)`。写入仍通过 `store.dispatch(action)`。

### `@slux/viewfly/state-machine`

`useMachine<Context, Event extends { type: string }, State extends string>(machine: StateMachine<Context, Event, State>): Accessor<MachineSnapshot<Context, State>>`。写入通过 `machine.send(event)`；快照的状态名与上下文分别读作 `accessor().value`、`accessor().context`。

### `@slux/viewfly/rxjs`

`useObservable<T>(source: ObservableState<T>): Accessor<T>`，接收 `fromObservable` 创建的桥接实例。写入通过上游 Observable / Subject；`status` / `error` 从来源读取，`dispose()` 由桥接创建者负责。

## 专属语义与边界

- **SSR / hydration**：一次性 HTML 渲染用 `viewfly({ root, nativeRenderer: new HTMLRenderer(), autoUpdate: false })` + `OutputTranslator`，渲染完成后调用 `app.destroy()`。由于订阅安排在下一微任务，**销毁早于微任务时不会残留订阅**，服务端只读取初始快照、不建立组件订阅。服务端不自动序列化、传输或恢复状态，也不改写全局 signal。SSR 与上下文的通用约定见仓库根 [README](../../README.md) 的「框架适配 · 通用约定」。
- **Scope**：`ScopeProvider` 是 `createContextProvider({ provide: SLUX_SCOPE })` 生成的组件， descendants 通过 `useScope()` 读取；`SLUX_SCOPE` 可用于原生注入配置。

  ```tsx
  createApp(jsx(ScopeProvider, { useValue: scope, children: jsx(Child, {}) }), false).mount(container);
  ```

  Scope 沿用 core 的**显式覆盖**语义：`scope.set(source, 9)` 不会改变组件内 `useSignal(source)()` 的全局读取值，`runInScope` 也不改写全局 signal 读写。

- **订阅与清理**：订阅由 `onMounted` 的 `queueMicrotask` 延迟建立，由 `onMounted` 返回的清理函数在 `app.destroy()` 时释放。卸载只解除**组件自身**绑定；flux / machine / observable 原实例不随之销毁，仍可继续写入，`dispose()` 由调用方负责。
- **快照相等判定**：`bindExternal` 与 `useStore` 默认 `Object.is`；自定义 `equals` 返回 `true` 时保留旧引用并跳过 `value.set`。proxy 快照冻结、未修改分支保持原引用。
- **错误处理**：绑定层不额外捕获异常、不吞错、不回滚写入；`source.get` / `subscribe` / core `effect` 抛出的错误按 `@slux/core` 的语义传播。

## 自动导入

🔌 `createAutoImportApis(prefix?)` 基于 `@slux/shared` 的 `generateBatchAutoImports` 返回 `unplugin-auto-import` 的 `ImportsMap`，来源名为 `@slux/viewfly`。登记清单（取自 `src/auto-import-api.ts` 的 `allImportApis`）：

`ScopeProvider`、`SLUX_SCOPE`、`useScope`、`useSignal`

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/viewfly";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

传入前缀会为登记项生成别名；前缀以小写字母结尾时 API 名首字母大写，规则由 `@slux/shared` 的 `createAutoImports` 统一决定。注意登记清单是**运行时值**，`Accessor` 作为纯类型不参与自动导入。

## 类型导出

💡 主入口 `src/index.ts` 唯一 re-export 的类型是 `Accessor<T>`（来自 `src/binding.ts`）；各子入口不再 re-export 类型。其余类型从来源包导入：

| 用到的类型                        | 来源                      |
| --------------------------------- | ------------------------- |
| `Accessor<T>`                     | `@slux/viewfly`（主入口） |
| `Subscribable<T>`、`Scope`        | `@slux/core`              |
| `ReadonlyAtom<T>`、`Atom<T>`      | `@slux/atom`              |
| `StoreApi<T>`                     | `@slux/store`             |
| `Snapshot<T>`                     | `@slux/proxy`             |
| `FluxStore`、`FluxAction`         | `@slux/flux`              |
| `MachineSnapshot`、`StateMachine` | `@slux/state-machine`     |
| `ObservableState<T>`              | `@slux/rxjs`              |

## 不适用的场景

- 需要可写 Accessor / 在绑定上直接 `set`：`Accessor` 只有 `() => T`，请用原实例写入。
- 期望绑定创建后立刻建立订阅、或依赖同步首帧通知：订阅在下一微任务，且挂载前销毁会取消订阅。
- 脱离组件 `onMounted` 生命周期调用并期望响应式更新：不会建立订阅。
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
