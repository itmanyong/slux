# @slux/svelte

🔌 把 `@slux/core` 的响应式状态转换成 Svelte 5 原生 `Readable` / `Writable` store（`svelte/store`），可用 `$store` 自动订阅。核心绑定是 `toReadable(source)` 与 `toWritable(signal)`：前者把任意 `Subscribable<T>` 桥接成 `Readable<T>`，后者额外提供 `set` / `update` 写回 core `Signal<T>`。主入口另提供 core `Scope` 的 context 封装与 `createAutoImportApis`。六个范式各通过独立子入口提供对应的 `Readable` / `Writable` 绑定。

跨框架一致的子入口划分、Flux / 状态机 / RxJS 的写入与桥接生命周期、Scope 显式覆盖语义与 SSR 通用约束见仓库根 [README](../../README.md) 的「框架适配 · 通用约定」；仓库内构建与验证命令见「本地开发」，本文不再重复。

## 特性与适用场景

| 🧭 场景                                                     | 是否适合 | 说明                                                                   |
| ----------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| 在 Svelte 5 组件里用 `$store` 自动订阅 slux 状态            | 适合     | `toReadable` / `toWritable` 返回原生 store，编译期自动订阅与退订       |
| 用 `svelte/store` 的 `get`、`derived` 组合状态              | 适合     | 返回值是标准 `Readable` / `Writable`                                   |
| 写回 core `Signal` 并支持函数值                             | 适合     | `toWritable` 的 `set` / `update` 保留函数值原引用                      |
| 消费 atom、store、proxy、flux、state-machine、rxjs 六种范式 | 适合     | 六个 `/xxx` 子入口分别导出对应绑定                                     |
| 组件外 / 异步回调读取 Scope，或期望自动套用 Scope 覆盖      | 不适合   | `setScope` / `getScope` 必须在组件初始化期间调用；store 始终读全局来源 |

## 安装

```sh
pnpm add @slux/svelte @slux/core svelte
```

| 📦 项       | 值                                                                                                                                    | 来源                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Svelte peer | `^5.0.0`                                                                                                                              | `package.json` `peerDependencies` |
| 必需 peer   | `@slux/core`（`workspace:^`）                                                                                                         | 同上                              |
| 可选 peer   | `@slux/atom`、`@slux/store`、`@slux/proxy`、`@slux/flux`、`@slux/state-machine`、`@slux/rxjs`（均 `workspace:^` 且 `optional: true`） | `peerDependenciesMeta`            |
| 运行时依赖  | `@slux/shared`（随包安装）                                                                                                            | `dependencies`                    |

📦 范式包是**可选 peer，只安装实际使用的**：用哪个子入口就装哪个包；`@slux/core` 是全部入口的必需依赖。`svelte/store` 与 context API 由 `svelte` 提供。

`package.json` 的 `exports` 子入口（每个都提供 ESM `import` 与 CJS `require`，并带 `.d.ts` / `.d.cts`）：

| 📦 子入口                    | 说明                                                                   |
| ---------------------------- | ---------------------------------------------------------------------- |
| `@slux/svelte`               | 主入口：`toReadable`、`toWritable`、Scope 封装、`createAutoImportApis` |
| `@slux/svelte/atom`          | atom 绑定                                                              |
| `@slux/svelte/store`         | store 绑定                                                             |
| `@slux/svelte/proxy`         | proxy 绑定                                                             |
| `@slux/svelte/flux`          | flux 绑定                                                              |
| `@slux/svelte/state-machine` | 状态机绑定                                                             |
| `@slux/svelte/rxjs`          | RxJS 桥接绑定                                                          |
| `@slux/svelte/package.json`  | 包元信息                                                               |

## 快速开始

```svelte
<script>
  import { signal } from "@slux/core";
  import { toWritable } from "@slux/svelte";

  const count = toWritable(signal(0));
</script>

<button onclick={() => count.update((n) => n + 1)}>{$count}</button>
```

🚀 `toWritable` 返回标准 `Writable<number>`，`$count` 由 Svelte 编译成自动订阅；`update` 写入 core `Signal`。`toReadable` 只提供 `subscribe`，写入仍走原来源。

## 主入口 API

### `toReadable`

```ts
function toReadable<T>(source: Subscribable<T>): Readable<T>;
```

用 `svelte/store` 的 `readable(source.get(), start)` 构造：

| 💡 阶段                      | 行为                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 初值                         | `readable` 的初始值是 `source.get()`，**每个订阅者立即收到当前值**                                                                                   |
| `start`（第一个订阅者到达）  | 订阅 `source.subscribe(set)` 写入 store、起 core `effect(() => source.get())` 刷新惰性 computed、再 `set(source.get())` 补读，对齐首次通知期间的写入 |
| `stop`（最后一个订阅者离开） | 执行 `start` 返回的清理函数，同时退订 `source.subscribe` 与释放 core `effect`                                                                        |
| 多订阅者                     | Svelte 只在第一个订阅者时调用一次 `start`，所有订阅者共享同一份底层订阅                                                                              |
| 重新订阅                     | 最后一个订阅者离开后再次订阅，以最新 `source.get()` 作为新初值并重新执行 `start`                                                                     |
| **不读 Scope**               | 源码未引用 `getScope()`，始终读全局 `source.get()`；覆盖需显式 `getScope()?.get(source)`                                                             |

自定义来源只需满足 `Subscribable<T>`（`get()` + `subscribe(cb)`，后者返回取消函数）。返回值可与 `svelte/store` 的 `get`、`derived` 组合。

### `toWritable`

```ts
function toWritable<T>(source: Signal<T>): Writable<T>;
```

| 💡 成员      | 实现                                | 说明                                                                                                                        |
| ------------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `subscribe`  | 复用 `toReadable(source).subscribe` | 与 `toReadable` 相同的 start / stop 通知与清理                                                                              |
| `set(value)` | `source.set(() => value)`           | 用 core 的 recipe 形式写入，**替换整个值**；`signal.set` 把函数参数当 recipe，用 `() => value` 包装才能把函数值本身存进信号 |
| `update(fn)` | `set(fn(source.get()))`             | 读当前值、经 `fn` 计算后写回；与 `set` 一样支持函数值                                                                       |

`set` / `update` 都写入原 `Signal<T>`（不创建副本）；只读来源（如 `computed`）在类型上不能传给 `toWritable`。

### Scope context

| 💡 导出     | 签名 / 类型                | 说明                                               |
| ----------- | -------------------------- | -------------------------------------------------- |
| `SCOPE_KEY` | `unique symbol`            | 供手动 `setContext` / `getContext` 集成的键        |
| `setScope`  | `(scope: Scope) => void`   | `setContext(SCOPE_KEY, scope)`，组件初始化期间调用 |
| `getScope`  | `() => Scope \| undefined` | `getContext(SCOPE_KEY)`，无提供者时 `undefined`    |

`getContext` / `setContext` 来自 `svelte`，**只能在组件初始化期间调用**：在组件外、事件处理器或异步回调中调用 `getScope()` 会抛错。嵌套组件取最近一层 `setScope`；替换 Scope 需重新创建子树。用法是在组件 `<script>` 顶层 `setScope(scope)`，后代用 `getScope()?.get(source)` 读取覆盖值。

## 子入口 API

🧭 六个子入口的绑定都基于 `toReadable`（`/store` 例外，见下），统一返回 `Readable` / `Writable`，并继承主入口的 start / stop 通知、立即初值与订阅清理边界。Flux / 状态机 / RxJS 的绑定只读，写入通过原实例的 `dispatch`、`send` 或上游 Observable 完成，绑定不返回写入 tuple 或 selector。

| 🧭 子入口        | 导出                    | 签名要点                                                                   | 返回值                                      | 写入方式                                |
| ---------------- | ----------------------- | -------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------- |
| `/atom`          | `toAtomValue`、`toAtom` | `<T>(atom)`                                                                | `Readable<T>`、`Writable<T>`                | `store.set/update` 或 `atom.set/update` |
| `/store`         | `toStore`               | `(store, selector?, equals?)`                                              | `Readable<T \| U>`                          | `store.setState(...)`                   |
| `/proxy`         | `toSnapshot`            | `<T extends object>(proxy: T)`                                             | `Readable<Snapshot<T>>`                     | 直接修改原 proxy                        |
| `/flux`          | `toFluxStore`           | `<State, Action extends FluxAction>(store)`                                | `Readable<State>`                           | `store.dispatch(action)`                |
| `/state-machine` | `toMachine`             | `<Context, Event extends { type: string }, State extends string>(machine)` | `Readable<MachineSnapshot<Context, State>>` | `machine.send(event)`                   |
| `/rxjs`          | `toObservableStore`     | `<T>(source: ObservableState<T>)`                                          | `Readable<T>`                               | 上游 Observable，创建者 `dispose()`     |

### `/atom`

```ts
import { atom, derived } from "@slux/atom";
import { toAtom, toAtomValue } from "@slux/svelte/atom";

const count = atom(0);
const doubled = derived((get) => get(count) * 2);
const writable = toAtom(count); // Writable<number>
const readonly = toAtomValue(doubled); // Readable<number>
writable.set(2);
writable.update((value) => value + 1);
```

`toAtomValue` 可读基础、派生与 writable atom（`AnyReadableAtom<T>`）；`toAtom` 返回 `Writable<T>`，其 `set` 调用 `atom.set(value)`、`update` 调用 `atom.update(fn)`（与 `toWritable` 的 recipe 写入不同）。派生 atom 不可传给 `toAtom`（类型上被禁止）。

### `/store`

```ts
import { createStore } from "@slux/store";
import { toStore } from "@slux/svelte/store";

const store = createStore(() => ({ count: 0, other: 0 }));
const count = toStore(store, (state) => state.count); // Readable<number>
const whole = toStore(store); // Readable<{ count: number; other: number }>
```

`toStore` **不经 `toReadable`**：直接用 `readable(select(store.getState()), start)`，`start` 里 `set(current)` 后返回 `store.subscribe(...)` 的取消函数作为清理，因此订阅的是 store 本身、不建立 core `effect`。`equals` 默认 `Object.is`，判定相等时不 `set`、不发布通知；selector 为纯函数。最后一个订阅者离开只解除自身订阅，不销毁 store。

### `/proxy`

`toSnapshot(proxy)` 返回 `Readable<Snapshot<T>>`：用 `@slux/proxy` 的 `snapshot` / `subscribe` 构造 `{ get, subscribe }` 再交给 `toReadable`；嵌套与深层变更都会发布新快照，快照深层只读，修改走原 proxy。

### `/flux`、`/state-machine`、`/rxjs`

三个绑定都直接 `return toReadable(原实例)`，继承 `toReadable` 的 start / stop 通知与订阅清理：

```ts
import { createFluxStore } from "@slux/flux";
import { fromObservable } from "@slux/rxjs";
import { Subject } from "rxjs";
import { toFluxStore } from "@slux/svelte/flux";
import { toObservableStore } from "@slux/svelte/rxjs";

const flux = createFluxStore((state: number, action: { type: "add"; amount: number }) => state + action.amount, 0);
const observable = fromObservable(new Subject<number>(), 0);
const fluxStore = toFluxStore(flux); // Readable<number>
const observableStore = toObservableStore(observable); // Readable<number>
// toMachine(machine) → Readable<MachineSnapshot<Context, State>>，含 value / context，写入 machine.send(event)
```

`toObservableStore` 只接收 `fromObservable(source, initialValue)` 产出的 `ObservableState<T>`，不接受原始 RxJS `Observable`；完成与错误读 `source.status` / `source.error`。最后一个订阅者离开只解除自身绑定，桥接 `dispose()` 由创建者负责。

## 专属语义与边界

### SSR 与 hydration

- 原生 `$store` 自动订阅在 SSR 渲染结束后由 Svelte 清理；手动调用 `subscribe` 时，**调用方负责执行返回的退订函数**。
- `toReadable` 不读取 `getScope()`：SSR 输出全局 `source.get()` 初值，不是 Scope 覆盖值。需要请求级覆盖时显式 `getScope()?.get(source)`，并为客户端准备相同的初始数据。全部子入口 SSR 行为一致：读各自来源当前值、渲染后清理消费订阅。

### 订阅与清理（start / stop 通知函数）

- `readable` 的 `start` 在**第一个订阅者**到达时调用一次，返回的函数在**最后一个订阅者离开**时执行；`toReadable` 借此把 `source.subscribe` 与 core `effect` 的生命周期绑定到订阅者数量，避免无人订阅时留下上游订阅。
- 每次 `subscribe` 立即收到当前值；`start` 内补读一次，对齐首次通知期间的写入；所有订阅者共享同一份底层订阅；最后一个订阅者离开后重新订阅会以最新值作为新初值并重新执行 `start`，`get(store)` 也会触发一次临时订阅。
- 退订不销毁原状态实例（store 的 `destroy()`、桥接的 `dispose()` 由创建方管理）。

### 快照相等判定与错误处理

- `toReadable` 依赖来源自身的相等判定：`source.subscribe` 只在来源通知时 `set`，core 的 `Object.is` / 自定义 `equals` 决定是否通知；`toStore` 用 `equals`（默认 `Object.is`）比较选择结果，相等时不发布。store 值是否冻结、结构是否共享由来源决定，proxy 快照深层只读。
- 绑定不捕获异常：`source.get()` 抛错会在 `readable` 初值或 `start` 求值时向上传播，订阅回调与 core `effect` 的错误沿用 `@slux/core` 的同步执行与错误汇总语义。

## 自动导入

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/svelte";

export default { plugins: [AutoImport({ imports: [createAutoImportApis()] })] };
```

🔌 `createAutoImportApis(prefix?)` 返回 `unplugin-auto-import` 的 `ImportsMap`，来源名 `@slux/svelte`。`src/auto-import-api.ts` 当前登记：`SCOPE_KEY`、`getScope`、`setScope`、`toReadable`、`toWritable`（仅主入口 API，**不含** `createAutoImportApis` 自身与各子入口绑定）。传入前缀时按 `@slux/shared` 的 `createAutoImports` 规则生成别名。

## 类型导出

💡 主入口与六个子入口都**只导出运行时函数 / 常量，不导出额外类型**。所用类型均按包名从原包导入：`Readable<T>` / `Writable<T>` 来自 `svelte/store`，`Subscribable<T>` / `Signal<T>` / `Scope` 来自 `@slux/core`，`Snapshot<T>` 来自 `@slux/proxy`，`FluxStore` / `MachineSnapshot` / `ObservableState` 来自 `@slux/flux` / `@slux/state-machine` / `@slux/rxjs`。

## 不适用的场景

- ⚠️ 在组件初始化之外（组件外、事件处理器、异步回调）调用 `setScope` / `getScope`：会抛错，需在组件 `<script>` 顶层调用。
- 期望绑定自动套用 Scope 覆盖值、把覆盖写回全局、SSR 自动序列化 / 恢复请求状态，或需要细粒度字段订阅：store 只读全局来源且为整对象级订阅，需调用方自行准备客户端初始数据与 Scope，见根 README 通用约定；细粒度订阅用 `toStore` 的 selector。

## 版本、许可与反馈

- 版本 `0.1.0`（`package.json`）· 许可 [MIT](../../LICENSE) © itmanyong · 仓库 `github.com/itmanyong/slux`（`packages/svelte`）。
- 问题反馈：[GitHub Issues](https://github.com/itmanyong/slux/issues)。

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
