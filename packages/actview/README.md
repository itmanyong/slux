# @slux/actview

🔌 把 `@slux/core` 及 6 个范式包的状态接入 **ActView 4**（peer 为 `@actview/core ^1.5.1`）。读取绑定统一以**只读浅 Ref**（`Readonly<Ref<T>>`，用 `.value` 读取）暴露，写入始终走原实例，绑定不提供 setter 也不创建副本。绑定在组件挂载或原生 effect scope 内建立，组件卸载 / scope 释放时自动清理。因 `@actview/core` 只提供 ESM，本包也**只发布 ESM 入口**。

[![GITHUB](https://img.shields.io/badge/GITHUB-181717?style=for-the-badge&logo=github&logoColor=white&color=green)](https://github.com/itmanyong/slux/tree/main/packages/actview) [![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white&color=orange)](https://www.npmjs.com/package/@slux/actview) [![在线文档](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E6%96%87%E6%A1%A3-0F766E?style=for-the-badge&color=blue)](https://itmanyong.github.io/slux/packages/actview/)

## 特性与适用场景

| 🧭 场景                                                                  | 是否适用 | 说明                                                     |
| ------------------------------------------------------------------------ | -------- | -------------------------------------------------------- |
| 在 ActView 4 组件内读取 `signal` / 惰性 `computed` / 任意 `Subscribable` | 适用     | `useSignal` 返回只读浅 Ref                               |
| 在模板或框架响应式计算里用 `.value` 追踪更新                             | 适用     | 浅 Ref 不深转换，按引用判定变化                          |
| 接入 atom / store / proxy / flux / state-machine / rxjs 范式             | 适用     | 各用对应子入口，见「安装」                               |
| 服务端 `renderToString` 输出初始快照                                     | 适用     | SSR 不打开组件订阅                                       |
| 需要可写容器、`ref.set`、双向绑定 tuple                                  | 不适用   | 返回值在类型层只读，写入走原实例                         |
| 脱离组件或 effect scope 调用读取 hook                                    | 不适用   | 缺少 `getCurrentInstance()` / `getCurrentScope()` 时抛错 |
| 需要自动请求级隔离、自动 SSR 序列化 / 恢复                               | 不适用   | 沿用 core 显式覆盖语义，见「专属语义与边界」             |

## 安装

```sh
pnpm add @slux/core @slux/actview @actview/core
```

- `@slux/core`（`workspace:^`）与 `@actview/core`（`^1.5.1`）是**必需 peer**；`@slux/shared` 是运行时依赖，会随包带入。
- **范式包是可选 peer，只装实际使用的**：`@slux/atom`、`@slux/store`、`@slux/proxy`、`@slux/flux`、`@slux/state-machine`、`@slux/rxjs`（均为 `workspace:^`，`peerDependenciesMeta` 标为 `optional`）。
- `exports` 只有 `import` 条件，无 `require` 分支，无 CJS 产物。

`exports` 子入口逐个对应：

| 📦 子入口                     | 所需范式 peer         | 主要导出                                                                     |
| ----------------------------- | --------------------- | ---------------------------------------------------------------------------- |
| `@slux/actview`               | `@slux/core`          | `useSignal`、`provideScope`、`useScope`、`SCOPE_KEY`、`createAutoImportApis` |
| `@slux/actview/atom`          | `@slux/atom`          | `useAtomValue`、`useSetAtom`、`useAtom`                                      |
| `@slux/actview/store`         | `@slux/store`         | `useStore`                                                                   |
| `@slux/actview/proxy`         | `@slux/proxy`         | `useSnapshot`                                                                |
| `@slux/actview/flux`          | `@slux/flux`          | `useFluxStore`                                                               |
| `@slux/actview/state-machine` | `@slux/state-machine` | `useMachine`                                                                 |
| `@slux/actview/rxjs`          | `@slux/rxjs`          | `useObservable`                                                              |
| `@slux/actview/package.json`  | —                     | 包元信息                                                                     |

> 💡 示例中的 `jsx` 来自框架配套包 `@actview/jsx`，`effectScope` 来自 `actview`；二者不是本包 peer，属于框架侧依赖。

## 快速开始

```tsx
import { defineComponent } from "@actview/core";
import { jsx } from "@actview/jsx";
import { signal } from "@slux/core";
import { useSignal } from "@slux/actview";

const count = signal(0);

export const Counter = defineComponent(() => {
  const value = useSignal(count); // Readonly<Ref<number>>
  return () => jsx("span", { children: value.value });
});

// 写入走原实例；绑定只读
count.set((n) => n + 1);
```

🚀 在纯响应式作用域（无组件）中读取，用原生 `effectScope` 包裹并负责释放：

```ts
import { effectScope } from "actview";
import { computed, signal } from "@slux/core";
import { useSignal } from "@slux/actview";

const source = signal(1);
const doubled = computed(() => source.get() * 2);

const scope = effectScope();
const value = scope.run(() => useSignal(doubled))!; // Readonly<Ref<number>>
value.value; // 2
source.set(3);
value.value; // 6（惰性 computed 被驱动重算）
scope.stop(); // 释放订阅与 core effect
```

## 主入口 API

| API                    | 签名                                               | 说明                                              |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------- |
| `useSignal`            | `<T>(source: Subscribable<T>) => Readonly<Ref<T>>` | 把任意可订阅源桥接为只读浅 Ref                    |
| `provideScope`         | `(scope: Scope) => void`                           | 在组件初始化中提供 core `Scope`                   |
| `useScope`             | `() => Scope \| undefined`                         | 读取最近的 core `Scope`，无提供时返回 `undefined` |
| `SCOPE_KEY`            | `Symbol.for("slux.actview.scope")`                 | 框架注入键                                        |
| `createAutoImportApis` | `(prefix?: string) => ImportsMap`                  | 生成自动导入配置，见「自动导入」                  |

🧭 `useSignal` 委托内部 `bindExternal(get, subscribe, equals)`，行为如下：

| 维度              | 行为                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------- |
| 读取形式          | `.value`；底层是 `@actview/core` 的 `shallowRef`，不做深响应式转换                        |
| 惰性 computed     | 除 `source.subscribe(notify)` 外，另起 core `effect(() => source.get())` 保持依赖刷新     |
| 相等判定          | 默认 `Object.is`；判定相等时不写回 `.value`，保留旧引用                                   |
| 组件订阅时机      | 存在组件实例时在 `onMounted` 内订阅；`onUnmounted` 释放                                   |
| 纯 scope 订阅时机 | 无组件、仅有 `getCurrentScope()` 时立即订阅，并用 `onScopeDispose` 注册释放               |
| 无作用域          | `getCurrentInstance()` 与 `getCurrentScope()` 均为空时抛 `Error`（消息含 `effect scope`） |
| 来源固定          | 绑定创建后 `source` / `selector` 固定，切换需重建组件或作用域                             |

## 子入口 API

🧭 所有读取绑定都返回**只读浅 Ref**（`Readonly<Ref<…>>`），写入一律通过原实例。

### `@slux/actview/atom`

| API            | 签名                                                                    | 返回值   | 写入方式                                             |
| -------------- | ----------------------------------------------------------------------- | -------- | ---------------------------------------------------- |
| `useAtomValue` | `<T>(atom: ReadonlyAtom<T>) => Readonly<Ref<T>>`                        | 只读 Ref | 只读；可写派生 atom 通过原 `atom.write`              |
| `useSetAtom`   | `<T>(atom: Atom<T>) => (value: T) => void`                              | setter   | 直接调用 `atom.set(value)`，函数值不会被当成 updater |
| `useAtom`      | `<T>(atom: Atom<T>) => readonly [Readonly<Ref<T>>, (value: T) => void]` | 二元组   | 同 `useSetAtom`                                      |

### `@slux/actview/store`

```ts
useStore<T>(store: StoreApi<T>): Readonly<Ref<T>>;
useStore<T, S>(store: StoreApi<T>, selector: (state: T) => S, equals?: (a: S, b: S) => boolean): Readonly<Ref<S>>;
```

`selector` 默认恒等、`equals` 默认 `Object.is`；比较器返回 `true` 时保留上一次结果引用。写入走 `store.setState`。

### `@slux/actview/proxy`

`useSnapshot<T extends object>(proxy: T): Readonly<Ref<Snapshot<T>>>`：返回**冻结且结构共享**的快照，订阅整个 proxy 及嵌套变化；通过原 proxy 对象修改状态。

### `@slux/actview/flux`

`useFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Readonly<Ref<State>>`，等价于 `useSignal(store)`。写入仍通过 `store.dispatch(action)`。

### `@slux/actview/state-machine`

`useMachine<Context, Event extends { type: string }, State extends string>(machine: StateMachine<Context, Event, State>): Readonly<Ref<MachineSnapshot<Context, State>>>`。写入通过 `machine.send(event)`；快照的状态名与上下文分别读作 `ref.value.value`、`ref.value.context`。

### `@slux/actview/rxjs`

`useObservable<T>(source: ObservableState<T>): Readonly<Ref<T>>`，接收 `fromObservable` 创建的桥接实例。写入通过上游 Observable / Subject；`status` / `error` 从来源读取，`dispose()` 由桥接创建者负责。

## 专属语义与边界

- **SSR / hydration**：`renderToString` 期间组件实例存在，但不执行 `onMounted`，因此**不打开任何订阅**，只读取初始快照。服务端不自动序列化、传输或恢复状态，也不改写全局 signal。SSR 与上下文的通用约定见仓库根 [README](../../README.md) 的「框架适配 · 通用约定」。
- **Scope**：`provideScope(scope)` 在组件初始化中调用，后代 `useScope()` 读取；`SCOPE_KEY` 是对应注入键。Scope 沿用 core 的**显式覆盖**语义：`scope.set(source, 9)` 不会改变组件内 `useSignal(source).value` 的全局读取值，`runInScope` 也不改写全局 signal 读写。
- **订阅与清理**：组件走 `onMounted` → `onUnmounted`，纯作用域走 `onScopeDispose` → `scope.stop()`。卸载只解除**组件自身**绑定；flux / machine / observable 原实例不随之销毁，仍可继续写入，`dispose()` 由调用方负责。
- **快照相等判定**：`bindExternal` 与 `useStore` 默认 `Object.is`；自定义 `equals` 返回 `true` 时保留旧引用并跳过 `.value` 写回。proxy 快照冻结、未修改分支保持原引用。
- **错误处理**：绑定层不额外捕获异常、不吞错、不回滚写入；`source.get` / `subscribe` / core `effect` 抛出的错误按 `@slux/core` 的语义传播。

## 自动导入

🔌 `createAutoImportApis(prefix?)` 基于 `@slux/shared` 的 `generateBatchAutoImports` 返回 `unplugin-auto-import` 的 `ImportsMap`，来源名为 `@slux/actview`。登记清单（取自 `src/auto-import-api.ts` 的 `allImportApis`）：

`SCOPE_KEY`、`provideScope`、`useScope`、`useSignal`

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/actview";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

传入前缀会为登记项生成别名；前缀以小写字母结尾时 API 名首字母大写，规则由 `@slux/shared` 的 `createAutoImports` 统一决定。

## 类型导出

💡 主入口 `src/index.ts` 与各子入口均**不 re-export 类型**，所需类型从来源包导入：

| 用到的类型                        | 来源                  |
| --------------------------------- | --------------------- |
| `Subscribable<T>`、`Scope`        | `@slux/core`          |
| `Ref<T>`                          | `@actview/core`       |
| `ReadonlyAtom<T>`、`Atom<T>`      | `@slux/atom`          |
| `StoreApi<T>`                     | `@slux/store`         |
| `Snapshot<T>`                     | `@slux/proxy`         |
| `FluxStore`、`FluxAction`         | `@slux/flux`          |
| `MachineSnapshot`、`StateMachine` | `@slux/state-machine` |
| `ObservableState<T>`              | `@slux/rxjs`          |

## 不适用的场景

- 需要可写 Ref / 在绑定上直接 `set`：返回值在类型层只读，请用原实例写入。
- 在组件初始化或原生 effect scope 之外调用 `useSignal` 等 hook：会抛错。
- 需要 CJS 入口：本包只发布 ESM。
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
