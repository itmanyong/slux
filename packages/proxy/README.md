# @slux/proxy

🪞 基于 `@slux/core` 的可变对象范式。`observable` 用 `Proxy` 包装普通对象 / 数组，属性赋值、删除与数组操作直接触发 core 的依赖通知；`observe` 按读取的属性自动追踪；`snapshot` 产出冻结、缓存、结构共享的只读快照；`ref` 用于把不想被代理的值按原引用嵌入状态。

[![GITHUB](https://img.shields.io/badge/GITHUB-181717?style=for-the-badge&logo=github&logoColor=white&color=green)](https://github.com/itmanyong/slux/tree/main/packages/proxy) [![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white&color=orange)](https://www.npmjs.com/package/@slux/proxy) [![在线文档](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E6%96%87%E6%A1%A3-0F766E?style=for-the-badge&color=blue)](https://itmanyong.github.io/slux/packages/proxy/)

代理不是 `Signal` 或 `Subscribable`：它没有 `get()` / `set()`，但读取属性会登记到 core 的依赖图，因此可以和 `@slux/core` 的 `computed`、`effect`、`batch` 混用。

| 💡 项            | 值                                                                | 来源                          |
| ---------------- | ----------------------------------------------------------------- | ----------------------------- |
| 包名 / 版本      | `@slux/proxy` `0.2.4`                                             | `package.json`                |
| 运行时依赖       | `@slux/core`、`@slux/shared`（`workspace:*`）                     | `package.json` `dependencies` |
| peer / 可选 peer | 无                                                                | `package.json`                |
| 子入口           | 无，只有 `.` 与 `./package.json`                                  | `package.json` `exports`      |
| 模块格式         | ESM `dist/index.js` + CJS `dist/index.cjs`，带 `.d.ts` / `.d.cts` | `package.json` `exports`      |
| `sideEffects`    | `false`                                                           | `package.json`                |
| 许可             | MIT                                                               | `package.json`                |

## 特性与适用场景

| 🧭 场景                                            | 是否适合 | 说明                                                              |
| -------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| 希望直接 `state.user.name = "Bob"` 更新状态        | 适合     | 写入经代理的 `set` / `defineProperty` / `deleteProperty` 进入追踪 |
| 按实际读取的属性细粒度重跑副作用                   | 适合     | `observe(fn)` 基于 core `effect`，动态收集依赖                    |
| 需要整棵对象图的只读快照                           | 适合     | `snapshot(proxy)` 冻结、缓存、结构共享                            |
| 状态里要放 DOM 节点、`Map` / `Set`、`Date`、类实例 | 适合     | 用 `ref(value)` 按原引用嵌入，不参与深层代理                      |
| 需要草稿式不可变更新、显式作用域覆盖               | 不适合   | 用 `@slux/core` 的 `signal.set(recipe)` 与 `Scope`                |
| 需要 atom / store / reducer 等组织范式             | 不适合   | 用 `@slux/atom` / `@slux/store` / `@slux/flux`                    |

## 安装

```sh
pnpm add @slux/core @slux/proxy
```

| 📦 项                                       | 情况                                         |
| ------------------------------------------- | -------------------------------------------- |
| `dependencies`                              | `@slux/core`、`@slux/shared`，安装时一并带入 |
| `peerDependencies` / `peerDependenciesMeta` | 无                                           |
| 可选 peer                                   | 无                                           |
| 子入口                                      | 无；全部导出从 `@slux/proxy` 主入口导入      |

📦 上例显式写出 `@slux/core`，是因为下文示例直接使用了它的 `batch` / `computed` / `effect`——**应用代码直接 import 的依赖应显式声明**；`@slux/shared` 只作间接依赖。仓库内验证命令集中在仓库根 [README](../../README.md) 的「本地开发」一节，本包不重复。

## 快速开始

```ts
import { batch } from "@slux/core";
import { observable, observe, ref, snapshot, subscribe } from "@slux/proxy";

const state = observable({
  user: { name: "Alice", age: 30 },
  todos: [] as Array<{ text: string; done: boolean }>,
  external: ref(new Map<string, number>()),
});

const dispose = observe(() => {
  console.log(state.user.name);
}); // 创建时立即同步执行一次

const unsubscribe = subscribe(state, () => {
  console.log(snapshot(state).user.name);
}); // 不立即调用

state.user.name = "Bob"; // observe 同步重跑；subscribe 同步通知
state.user.age++; // 上面的 observe 没读 age，不重跑（subscribe 仍会收到通知）

batch(() => {
  state.user.name = "Carol";
  state.todos.push({ text: "学习 proxy", done: false });
}); // observe 合并到批结束；subscribe 在批内逐次同步通知

const current = snapshot(state);
console.log(current.todos[0]?.text);
unsubscribe();
dispose();
```

## 核心 API

| 🧩 导出                | 签名                                                | 行为                                           |
| ---------------------- | --------------------------------------------------- | ---------------------------------------------- |
| `observable`           | `<T extends object>(initialObj: T): T`              | 包装普通对象、数组或无原型对象，保留输入类型   |
| `subscribe`            | `(proxy: object, callback: () => void): () => void` | 订阅自身与任意后代的变更，返回退订函数         |
| `observe`              | `(fn: () => void): () => void`                      | 自动追踪读取依赖，返回停止观察函数             |
| `snapshot`             | `<T extends object>(proxy: T): Snapshot<T>`         | 深层只读、冻结、支持结构共享的快照             |
| `ref`                  | `<T>(value: T): Ref<T>`                             | 创建 `{ current: value }` 包装，不参与深层代理 |
| `createAutoImportApis` | `(prefix?: string): ImportsMap`                     | 自动导入配置                                   |

### `observable(initialObj)` → 代理

- **可被代理的值**：原型为 `Object.prototype`、`Array.prototype` 或 `null` 的普通对象 / 数组 / 无原型对象；否则抛 `Error("observable() requires a plain object or array")`。`Date`、`Map`、`Set`、类实例、`Ref` 和函数保留原引用、不递归代理，**不能作为根值**，但可作为对象属性或放进 `ref`。
- **身份稳定**：同一原始对象或已有代理始终对应同一个代理（`WeakMap` 缓存），嵌套共享引用也保持相同身份。
- **追踪的操作**：字符串与 symbol 属性读取；`in` 跟踪属性是否存在；`Object.keys` / `ownKeys` 跟踪自有键及可枚举性；`Object.defineProperty` 与访问器写入遵循属性依赖。
- **相等判定**：`Object.is` 相等的普通赋值不通知（`NaN` 相等、`0` 与 `-0` 不同）；新增值为 `undefined` 的属性仍改变对象结构，会通知。
- **数组**：支持索引写入、`push`、`splice`、`sort` 和 `length` 截断；截断会更新被移除索引的依赖并解除其父链。复合操作可能产生多次写入，需要一次响应式计算时用 core 的 `batch` 包住。
- **对象图**：父子关系在创建时预连接数据属性；子节点变更沿 `parents` 向上传播，共享或循环引用只传播一次；替换、删除子节点或截断数组后，旧子节点不再通知已脱离的父对象。不可配置且不可写的固定数据属性按 JavaScript `Proxy` 不变量返回原引用。

### `observe(fn)` → 停止观察函数

💡 `observe` 等价于 `effect(() => { fn(); })`，完全同步：创建时立即执行一次，依赖变化后在写入返回前同步重跑，受 core `batch` 合并约束，**不使用微任务队列**。条件分支动态收集依赖，下次执行只保留实际读取的属性。

- 可与 core `computed` / `effect` 混用：`computed(() => state.count * 2)` 按属性追踪，`computed(() => snapshot(state))` 追踪整个对象图。
- **忽略回调返回值**：`fn` 返回的函数不会作为清理函数执行；只有 `observe` 返回的 `dispose()` 会停止追踪。`dispose()` 可重复调用（幂等）。

```ts
import { computed, effect } from "@slux/core";
import { observable, snapshot } from "@slux/proxy";

const state = observable({ count: 0, enabled: true });
const doubled = computed(() => state.count * 2);
const entireState = computed(() => snapshot(state));
const dispose = effect(() => {
  console.log(doubled.get(), entireState.get().enabled);
});
state.count++;
dispose();
```

### `subscribe(proxy, callback)` → 退订函数

- 传入非代理对象会抛 `Error("Object is not an observable")`；订阅时**不立即调用**，回调无参数，可在其中调用 `snapshot` 读取当前数据。
- 每次实际写入或删除后同步通知；订阅自身与任意后代的变更。同一次子节点修改经共享引用的多条路径到达父对象时，父订阅只调用一次。
- 通知期间退订 / 新增订阅不破坏当前遍历，新增订阅从**后续变更**开始生效；退订可重复调用。
- **错误**：回调抛错不阻断同轮其他订阅与 core `effect`，已写入的状态保留；`runAll` 汇总后单个错误原样抛出、多个错误以 `AggregateError` 报告。

| 🧭 写入方式      | 未用 `batch`                  | 显式 `batch` 内                                 |
| ---------------- | ----------------------------- | ----------------------------------------------- |
| `observe` 重跑   | 写入返回前同步完成            | 合并到最外层 `batch` 结束，只重跑一次（最终值） |
| `subscribe` 回调 | 每次实际写入 / 删除后同步通知 | **仍逐次同步通知**，每次写入各一次              |

### `snapshot(proxy)` → 只读快照

```ts
import { observable, snapshot } from "@slux/proxy";

const state = observable({ count: 0, user: { name: "Alice" } });
const before = snapshot(state);
state.count++;
const after = snapshot(state);

console.log(after !== before); // true
console.log(after.user === before.user); // true，未变子树结构共享
console.log(snapshot(state) === after); // true，版本未变时复用缓存
```

- **冻结与缓存**：普通对象与数组递归复制并 `Object.freeze`，不冻结原始状态；`state.revision.get()` 在响应式计算中跟踪整个对象图。命中 `cachedSnapshot` 且版本一致时复用同一引用；任一祖先版本变化会使相关快照失效。
- **结构共享**：未变子树保留引用、共享子对象身份；支持循环引用（`seen` 表）、symbol 属性、非枚举属性、无原型对象、稀疏数组的空洞与长度。
- **不冻结的外部值**：`Ref`、函数和内建对象（`Date` / `Map` / `Set` 等）按原引用保留、不冻结，因此这些值不是不可变数据。`Snapshot<T>` 在类型层面把属性递归标记只读，函数仍可调用。
- **访问器**：读取快照时求值；其返回的子对象在读取时建立父子关系。快照缓存要求 getter 不修改状态、也不依赖代理之外的可变数据。原型替换不属于响应式 API。

### `ref(value)` → `Ref<T>`

```ts
import { observable, ref } from "@slux/proxy";

const connection = ref({ connected: false });
const state = observable({ connection });

state.connection.current.connected = true; // 不通知
state.connection = ref({ connected: false }); // 替换属性，通知
```

- 读取返回 `Ref<T>` 包装本身，**不会自动解包** `current`；`state.connection.current` 上的修改不触发响应式更新，也不会使快照缓存失效。
- 快照中 `Ref` 按原引用保留、不冻结。
- 用途：把 DOM 节点、`Map` / `Set`、`Date`、类实例等既不想被代理、也不想被追踪的值嵌入状态。

## 关键语义与边界

- ⚠️ **直接修改原 proxy 才触发通知**（本包最重要的边界）：只有对 `observable()` 返回的代理执行赋值、删除、`defineProperty` 或数组变更，才会进入 `Proxy` handler 并发布通知。直接修改**初始原始对象**、内建对象内部、`ref.current` 或**快照**都不触发响应式更新，也不会使快照缓存失效。
- **依赖收集与通知时机**：读取属性登记依赖，分支切换后释放旧依赖；`observe` 与 core `computed` / `effect` 同步重跑，`subscribe` 每次实际写入同步通知；两者在 `batch` 内的差异见上表。
- **错误处理**：通知与 effect 的错误由 `@slux/shared` 的 `runAll` 汇总——单个原样抛、多个 `AggregateError`；抛错不回滚已提交的状态，也不阻断同轮其他回调。
- **清理**：`observe` 返回的 `dispose` 与 `subscribe` 返回的退订函数都可重复调用；`observe` 的回调返回值被忽略，不能在回调里返回清理函数。
- **Scope / SSR**：代理没有 `get()` / `set()`，不是 `Subscribable`，**不能直接传给 core 的 `scope.get` / `scope.set`**；SSR 时为每个请求创建独立的 `observable` 实例即可。跨框架通用的 Scope 显式覆盖与 SSR 约定见仓库根 [README](../../README.md) 的「框架适配 · 通用约定」一节。
- **职责边界**：本包不提供信号、atom、store、reducer 或状态机；不可变草稿更新由 `@slux/core` 负责。

## 自动导入

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/proxy";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

🔌 `createAutoImportApis(prefix?)` 基于 `@slux/shared` 的 `generateBatchAutoImports` 生成 `ImportsMap`，来源名为 `@slux/proxy`。`src/auto-import-api.ts` 的登记清单（`allImportApis`）为：

```ts
const allImportApis: string[] = ["observable", "observe", "ref", "snapshot", "subscribe"];
```

默认无前缀；传入前缀可生成别名，如 `createAutoImportApis("u")` → `uObservable`、`uSnapshot` 等，大小写规则由 `@slux/shared` 的 `createAutoImports` 决定。清单与入口运行时导出数不一致：`createAutoImportApis` 自身不登记为可自动导入的标识符。

## 类型导出

💡 `src/index.ts` 的 `export type` 共 2 个：

| 💡 类型       | 用途                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Ref<T>`      | `{ current: T }` 加一个内部只读 symbol 标记；`ref(value)` 的返回类型，属性访问需经 `.current`                                                     |
| `Snapshot<T>` | 把对象属性递归标记为只读的函数类型除外：`T extends (...args) => unknown ? T : T extends object ? { readonly [K in keyof T]: Snapshot<T[K]> } : T` |

```ts
// Snapshot<T> 的定义（src/types.ts）
type Snapshot<T> = T extends (...args: never[]) => unknown ? T : T extends object ? { readonly [K in keyof T]: Snapshot<T[K]> } : T;
```

`REF_MARKER` 是 `src/types.ts` 中的内部 `unique symbol`，未从入口导出；消费端只需使用 `Ref<T>` 与 `ref`，不要依赖该符号。

## 不适用的场景 / 与其他包分工

| ⚠️ 需求                                   | 应使用的包                        |
| ----------------------------------------- | --------------------------------- |
| 草稿式不可变更新、显式 `Scope` 覆盖       | `@slux/core`                      |
| 小型独立状态、派生 atom、请求级 atom 隔离 | `@slux/atom`                      |
| 关联状态 + action、中间件链               | `@slux/store`                     |
| reducer / dispatch / action 中间件        | `@slux/flux`                      |
| 事件驱动的离散状态与 guard                | `@slux/state-machine`             |
| Observable 与状态双向桥接                 | `@slux/rxjs`                      |
| 组件内读取（hooks / Ref / Signal 等）     | 对应的 `@slux/react` 等框架适配包 |

## 版本、许可与反馈

- 📚 版本：`0.2.4`（`package.json`）。
- 许可：MIT，见仓库根 [LICENSE](../../LICENSE)。
- 问题反馈：[GitHub Issues](https://github.com/itmanyong/slux/issues)（`package.json` `bugs.url`）。

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
