# @slux/atom

⚛️ 基于 `@slux/core` 的原子状态范式：用小型 atom 组合状态、`derived` 表达派生、`writableAtom` 自定义写入、`atomFamily` 参数化缓存、`createAtomScope` 隔离取值。

[![GITHUB](https://img.shields.io/badge/GITHUB-181717?style=for-the-badge&logo=github&logoColor=white&color=green)](https://github.com/itmanyong/slux/tree/main/packages/atom) [![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white&color=orange)](https://www.npmjs.com/package/@slux/atom) [![在线文档](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E6%96%87%E6%A1%A3-0F766E?style=for-the-badge&color=blue)](https://itmanyong.github.io/slux/packages/atom/)

atom 对象本身只是「配置描述 + 默认作用域的代理」：真正的响应式节点由每个作用域按需创建的 core `signal` / `computed` 承载，因此 atom 可被 core 的 `computed`、`effect`、`batch` 直接读取。六个范式包共享 core 运行时，可放在同一个依赖图中使用。

| 💡 项            | 值                                                                | 来源                          |
| ---------------- | ----------------------------------------------------------------- | ----------------------------- |
| 包名 / 版本      | `@slux/atom` `0.2.4`                                              | `package.json`                |
| 运行时依赖       | `@slux/core`、`@slux/shared`（`workspace:*`）                     | `package.json` `dependencies` |
| peer / 可选 peer | 无                                                                | `package.json`                |
| 子入口           | 无，只有 `.` 与 `./package.json`                                  | `package.json` `exports`      |
| 模块格式         | ESM `dist/index.js` + CJS `dist/index.cjs`，带 `.d.ts` / `.d.cts` | `package.json` `exports`      |
| `sideEffects`    | `false`                                                           | `package.json`                |
| 许可             | MIT                                                               | `package.json`                |

## 特性与适用场景

| 🧭 场景                              | 是否适合 | 说明                                                   |
| ------------------------------------ | -------- | ------------------------------------------------------ |
| 一组小型、彼此独立的读写状态         | 适合     | `atom(initialValue)` 是最小的可写单元                  |
| 由多个状态算出的派生值               | 适合     | `derived(read)` 惰性、缓存、动态依赖追踪               |
| 写入需要转换、联动或返回自定义结果   | 适合     | `writableAtom(read, write)` 保留参数与返回值类型       |
| 按参数复用同类 atom（如按 id）       | 适合     | `atomFamily(factory)` 提供 `Map` 缓存与 `remove`       |
| 每个请求 / 测试要独立的值            | 适合     | `createAtomScope()` 让同一 atom 在不同作用域取值独立   |
| 需要草稿式局部修改、不可变结构共享   | 不适合   | atom 的 `set` 是整体替换；用 core `signal.set(recipe)` |
| 需要把关联字段与 action 放进同一对象 | 不适合   | 用 `@slux/store`                                       |
| 需要直接改对象属性触发更新           | 不适合   | 用 `@slux/proxy`                                       |

## 安装

```sh
pnpm add @slux/core @slux/atom
```

| 📦 项                                       | 情况                                         |
| ------------------------------------------- | -------------------------------------------- |
| `dependencies`                              | `@slux/core`、`@slux/shared`，安装时一并带入 |
| `peerDependencies` / `peerDependenciesMeta` | 无                                           |
| 可选 peer                                   | 无                                           |
| 子入口                                      | 无；全部导出从 `@slux/atom` 主入口导入       |

📦 上例显式写出 `@slux/core`，是因为下文示例直接使用了它的 `batch` / `computed` / `effect`——**应用代码直接 import 的依赖应显式声明**；`@slux/shared` 只作间接依赖。仓库内验证命令集中在仓库根 [README](../../README.md) 的「本地开发」一节，本包不重复。

## 快速开始

```ts
import { atom, derived } from "@slux/atom";
import { batch } from "@slux/core";

const count = atom(0);
const doubled = derived((get) => get(count) * 2);

const stop = doubled.subscribe((value) => console.log(value)); // 不立即通知
count.set(2); // 通知 4
count.update((value) => value + 1); // 通知 6
console.log(doubled.get()); // 6

batch(() => {
  count.set(10);
  count.set(20);
}); // 批处理结束，订阅只收到最终值 40

stop();
```

## 核心 API

| 🧩 导出                | 签名                                                                                   | 返回               |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------ |
| `atom`                 | `atom<T>(initialValue: T): Atom<T>`                                                    | 基础可写 atom      |
| `derived`              | `derived<T>(read: (get: AtomGetter) => T): ReadonlyAtom<T>`                            | 只读派生 atom      |
| `writableAtom`         | `writableAtom(read, write)`（两个重载，见下）                                          | 自定义写入 atom    |
| `atomFamily`           | `atomFamily<Param, Result>(factory): ((param) => Result) & { remove(param): boolean }` | 带缓存的参数化工厂 |
| `createAtomScope`      | `createAtomScope(): AtomScope`                                                         | 独立作用域         |
| `createAutoImportApis` | `createAutoImportApis(prefix?: string): ImportsMap`                                    | 自动导入配置       |

### `atom(initialValue)` → `Atom<T>`

| 💡 成员         | 签名                                     | 行为                                                                                 |
| --------------- | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| `get()`         | `() => T`                                | 读取默认作用域中的当前值；在 `derived` / core `computed` / `effect` 内读取会收集依赖 |
| `set(value)`    | `(value: T) => void`                     | **整体替换**，包括函数值；不接受 core 的 draft recipe                                |
| `update(fn)`    | `(fn: (current: T) => T) => void`        | 读取当前值、用 `fn` 算出新值、再 `set`；`fn` 必须返回同类型新值                      |
| `subscribe(cb)` | `(cb: (value: T) => void) => () => void` | 订阅**后续**变化，不立即调用；返回可重复调用的幂等清理函数                           |

**`set(value)` 与 `update(fn)` 的区别**：`set` 直接把入参作为新值保存（内部对函数值用 `target.set(() => value)`，避免 core 把函数当作 recipe 执行）；`update` 等价于 `value.set(fn(value.get()))`，只是「读当前值 + 计算 + 替换」的组合。二者写入的都是**整体值**，对象 / 数组按引用保存，直接修改 `get()` 返回的对象不会触发通知。

> ⚠️ 注意：`update` 是本包 `Atom<T>` 自己实现的方法（基于 `get()` + `set()`）。`@slux/core` 的 `Signal` **不提供 `update`**，其基础类型通过 `set((current) => ...)` 更新；不要把 core 的 `set(recipe)` 草稿写法套到 atom 上，也不要用 `atom.set((draft) => ...)` 期待局部修改。

```ts
import { atom } from "@slux/atom";

const callback = atom<(() => number) | undefined>(undefined);
const fn = () => 1;
callback.set(fn); // 保存函数本身，不会执行它
callback.get(); // fn
callback.update(() => fn); // 基于当前值计算后再替换
```

### `derived(read)` → `ReadonlyAtom<T>`

`read` 接收类型安全的 `get`（`AtomGetter`），可读取本包 atom、core 的 `signal` / `computed`，以及任意满足 `Subscribable<T>` 的对象。返回值只读（没有 `set` / `update` / `write`）。

```ts
import { computed, signal } from "@slux/core";
import { atom, derived } from "@slux/atom";

const source = signal(1);
const extra = atom(10);
const sum = derived((get) => get(source) + get(extra));
sum.get(); // 11；首次读取时惰性求值
source.set(2);
sum.get(); // 12
const twice = computed(() => sum.get() * 2); // 派生 atom 可再被 core computed 读取
console.log(twice.get());
```

- **惰性与缓存**：无订阅时按读取惰性计算，依赖未变时复用结果。
- **动态依赖**：`read` 每次执行只保留实际读取的源；分支切换后不再因旧分支变化而重算。
- **相等判定**：`Object.is`（`NaN` 视为相等，`0` 与 `-0` 视为不同）；派生结果不变时跳过下游通知。
- **主动通知**：有订阅时由作用域内的 `effect` 主动求值，依赖变化后同步通知；菱形依赖只产出一致状态，不产生中间值。
- **错误恢复**：`read` 抛错后保留重试标志，依赖修复或下次读取时可恢复。
- **异步结果**：`read` 可返回 `Promise`（`ReadonlyAtom<Promise<T>>`），依赖不变时复用同一个 `Promise`，详见「关键语义与边界」。

### `writableAtom(read, write)` → `WritableAtom<Value, Args, Result>`

两个重载：

```ts
// 只写 atom：read 为 null，读取值恒为 null
writableAtom<Args extends unknown[], Result>(
  read: null,
  write: (get: AtomGetter, set: AtomSetter, ...args: Args) => Result,
): WritableAtom<null, Args, Result>;

// 读写 atom
writableAtom<Value, Args extends unknown[], Result>(
  read: ((get: AtomGetter) => Value) | null,
  write: (get: AtomGetter, set: AtomSetter, ...args: Args) => Result,
): WritableAtom<Value, Args, Result>;
```

成员：`get()`、`subscribe(cb)`、`write(...args)`。`write` 的参数与返回值保留类型推导；`get` 读、`set` 写都作用于**默认作用域**；`AtomSetter` 只接受基础 `Atom<T>`，调用其他写入动作要用它自己的 `write` 方法。

```ts
import { atom, writableAtom } from "@slux/atom";

const celsius = atom(0);
const fahrenheit = writableAtom(
  (get) => (get(celsius) * 9) / 5 + 32,
  (_get, set, next: number) => {
    set(celsius, ((next - 32) * 5) / 9);
  },
);
fahrenheit.get(); // 32
fahrenheit.write(212);
celsius.get(); // 100

const reset = writableAtom(null, (_get, set) => set(celsius, 0));
reset.write();
reset.get(); // null，类型也推导为 null
```

整个同步 `write` 被包在 core 的 `batch` 中：内部可多次 `set`、可嵌套调用其他 `write`，写入过程中能立即读到新值，订阅只收到最终值。

### `atomFamily(factory)` → 带缓存的工厂

```ts
import { atom, atomFamily, derived } from "@slux/atom";

const counts = atomFamily((id: string) => atom({ id, count: 0 }));
const doubled = atomFamily((id: string) => derived((get) => get(counts(id)).count * 2));

counts("first") === counts("first"); // true，同参数复用
doubled("first").get(); // 0
counts.remove("first"); // true，仅移除缓存
```

- 缓存用 `Map`，参数按 **SameValueZero** 比较：对象按引用，`NaN` 等于 `NaN`，`0` 等于 `-0`。
- `remove(param)` 返回 `boolean`（`Map.delete` 的结果）；**只删缓存**，不销毁旧实例、不清理其现有订阅；删除后再次访问会创建新实例。
- 工厂可返回派生 atom；返回 `undefined` 也会缓存。工厂抛错时本次不写入缓存，下次同参数会重试。
- 缓存持续保留，动态集合在不再需要时主动调用 `remove`。

### `createAtomScope()` → `AtomScope`

```ts
import { atom, createAtomScope, derived } from "@slux/atom";

const count = atom(0);
const doubled = derived((get) => get(count) * 2);
const request = createAtomScope();

request.set(count, 5);
request.get(count); // 5
request.get(doubled); // 10（派生在该作用域内独立计算）
count.get(); // 0，默认作用域不受影响

const stop = request.sub(doubled, (value) => console.log(value)); // 不立即通知
request.set(count, 6); // 通知 12
stop();
```

| 💡 成员            | 签名                                                                  | 行为                                                              |
| ------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `get(atom)`        | `<T>(atom: AnyReadableAtom<T>) => T`                                  | 读取本作用域中的值；首次访问时按需创建 core `signal` / `computed` |
| `set(atom, value)` | `<T>(atom: Atom<T>, value: T) => void`                                | 写入**基础 atom**；只读 atom / 派生 atom 在类型上被禁止           |
| `sub(atom, cb)`    | `<T>(atom: AnyReadableAtom<T>, cb: (value: T) => void) => () => void` | 订阅本作用域的变化，返回幂等清理函数                              |

`AtomScope` **没有** `write`、`destroy` 或 `dispose` 方法。作用域内修改基础 atom 用 `scope.set`；调用 `writableAtom.write` 始终写入默认全局作用域。

## 关键语义与边界

- ⚠️ **依赖收集与通知时机**：`get()` 在派生 / core 计算 / effect 内自动收集依赖；`subscribe` 不立即发送当前值；订阅回调内的其他读取不会成为该订阅的依赖；最后一个订阅清理后，派生计算恢复惰性。
- **相等判定**：core `signal` 与订阅过滤都用 `Object.is`，`NaN` 相等、`0` / `-0` 不同；派生结果 `Object.is` 相等时不通知下游。
- **批处理**：写入与通知受 core `batch` 约束，最外层结束统一刷新；`writableAtom.write` 自动包在 `batch` 中并支持嵌套；批处理内创建订阅不会收到初始值。
- **错误**：`writableAtom.write` 抛错**不回滚**已完成的写入，后续写入与通知恢复正常；`derived` 计算抛错可在依赖修复后重试；通知阶段的错误由 core / `@slux/shared` 的 `runAll` 汇总，单个原样抛、多个 `AggregateError`。
- **清理**：`subscribe` 与 `scope.sub` 返回的清理函数可重复调用；作用域内逐个清理订阅是调用方的责任。
- **异步**：`derived(async (get) => ...)` 保存并返回 `Promise`，依赖不变时复用同一个 `Promise`；依赖必须在**第一个 `await` 之前**读取，之后的读取不被 core 自动追踪；`Promise` 完成不再通知。`writableAtom.write` 返回 `Promise` 时，`batch` 只覆盖第一个 `await` 之前的同步部分。本包不提供请求取消、过期结果合并或框架 Suspense 适配器。
- **作用域隔离边界**：每个作用域用 `WeakMap` 缓存自己的 core `signal` / `computed`，首次访问按配置创建（`base` → `signal(initialValue)`，`derived` → `computed(() => read(this.get))`），赋值、派生缓存与订阅彼此独立。模块级的 `getDefaultScope()` 是懒创建的单例，atom 自身的 `get/set/update/subscribe/write` **始终**走它。core `signal` / `computed` 及其他外部 `Subscribable` 因无 atom 配置而**原样透传、不被隔离**，可直接使用 `scope.get` / `scope.sub`。初始对象不深拷贝，隔离的是**赋值**而非对象的原地修改。
- **Scope / SSR**：跨框架通用的 Scope 显式覆盖与 SSR 约定见仓库根 [README](../../README.md) 的「框架适配 · 通用约定」一节。本包差异：SSR 时为每个请求新建 `createAtomScope()`，并**全程**通过 `scope.get` / `scope.set` / `scope.sub` 访问（atom 自身方法会落到默认全局作用域）；`AtomScope` 没有整体销毁方法，请求结束需逐个调用 `sub` 返回的清理函数。

## 自动导入

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/atom";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

🔌 `createAutoImportApis(prefix?)` 基于 `@slux/shared` 的 `generateBatchAutoImports` 生成 `ImportsMap`，来源名为 `@slux/atom`。`src/auto-import-api.ts` 的登记清单（`allImportApis`）为：

```ts
const allImportApis: string[] = ["atom", "atomFamily", "createAtomScope", "derived", "writableAtom"];
```

默认无前缀；传入前缀可生成别名，如 `createAutoImportApis("u")` → `uAtom`、`uDerived` 等，大小写规则由 `@slux/shared` 的 `createAutoImports` 决定。清单与入口运行时导出数不一致：`createAutoImportApis` 自身不登记为可自动导入的标识符。

## 类型导出

💡 `src/index.ts` 的 `export type` 共 7 个：

| 💡 类型                             | 用途                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `Atom<T>`                           | 基础可写 atom：`Subscribable<T> & { set(value: T): void; update(fn: (current: T) => T): void }` |
| `ReadonlyAtom<T>`                   | 只读 atom，等价于 `Subscribable<T>`                                                             |
| `WritableAtom<Value, Args, Result>` | 带自定义 `write(...args): Result` 的 atom                                                       |
| `AnyReadableAtom<T>`                | `Atom<T> \| ReadonlyAtom<T> \| WritableAtom<T, unknown[], unknown>` 联合                        |
| `AtomGetter`                        | `<Value>(atom: Subscribable<Value>) => Value`，读 atom 或任意 `Subscribable`                    |
| `AtomSetter`                        | `<Value>(atom: Atom<Value>, value: Value) => void`，只允许基础 atom                             |
| `AtomScope`                         | `{ get; set; sub }`，独立作用域契约                                                             |

`Subscribable<T>` 来自 `@slux/core`，本包引用但不重新导出。

## 不适用的场景 / 与其他包分工

| ⚠️ 需求                               | 应使用的包                           |
| ------------------------------------- | ------------------------------------ |
| 草稿式局部修改、不可变结构共享        | `@slux/core` 的 `signal.set(recipe)` |
| 关联状态 + action 放一起、中间件链    | `@slux/store`                        |
| 直接改对象属性触发更新                | `@slux/proxy`                        |
| reducer / dispatch / action 中间件    | `@slux/flux`                         |
| 事件驱动的离散状态与 guard            | `@slux/state-machine`                |
| Observable 与状态双向桥接             | `@slux/rxjs`                         |
| 组件内读取（hooks / Ref / Signal 等） | 对应的 `@slux/react` 等框架适配包    |

## 版本、许可与反馈

- 版本：`0.2.4`（`package.json`）。
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
