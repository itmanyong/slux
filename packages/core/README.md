# @slux/core

框架无关的响应式核心库，构建于 [limu](https://github.com/tnfe/limu) 的不可变状态容器之上。所有信号写入统一通过 `set`，提供惰性计算、同步副作用、批处理合并与可隔离的作用域。

- 零框架依赖：运行时使用 `@slux/shared` 与 `limu`，可单独用于 Node、浏览器或任意 UI 框架的底层状态层。
- 不可变更新：基于 limu 的 draft 提交，天然结构共享，未修改的分支保留原引用。
- 同步语义：effect 在写入返回前同步重跑，调试与推理更直观。
- 双格式产物：`type: module`，同时输出 ESM（`index.js`）与 CJS（`index.cjs`），并携带 `.d.ts` 类型。

## 特性

- **信号（`signal`）**：可写、可读、可订阅的基础响应式单元，写入支持「整体替换」与「draft 局部修改」两种模式。
- **计算属性（`computed`）**：惰性求值、结果缓存、动态依赖追踪的只读信号，派生结果相等时跳过下游计算。
- **副作用（`effect`）**：首次同步执行，依赖变化后同步重跑，支持返回清理函数，返回幂等的释放函数。
- **批处理（`batch`）**：合并多次写入的通知与 effect，外层结束时统一刷新；支持嵌套。
- **作用域（`Scope`）**：在同步回调期间隔离信号取值与赋值的显式容器，支持 `fork` 动态继承与快照序列化。
- **自动导入**：`createAutoImportApis` 一键生成 `unplugin-auto-import` 配置。
- **类型安全**：`Signal` / `ReadonlySignal` / `Subscribable` / `Scope` 等类型约束写入与依赖关系，`equals` 支持自定义相等判定。

## 安装

```sh
# pnpm（推荐，仓库使用 pnpm workspace）
pnpm add @slux/core

# npm
npm install @slux/core

# yarn
yarn add @slux/core
```

> 说明：本包通过 `exports` 同时提供 ESM 与 CJS 入口，并随包发布 `.d.ts` 类型声明，大多数打包器（webpack / rspack / rollup / vite / tsup）无需额外配置即可获得类型提示与 tree-shaking（`sideEffects: false`）。

## 快速开始

```ts
import { batch, computed, effect, signal } from "@slux/core";

const count = signal(0);
const doubled = computed(() => count.get() * 2);

// effect 首次同步执行，之后在依赖变化后同步重跑
const dispose = effect(() => {
  console.log(count.get(), doubled.get());
});
// 输出：0 0

// 批处理内的多次写入合并为一次通知/重跑
batch(() => {
  count.set(2);
  count.set((value) => value + 1);
});
// 输出：3 6

dispose(); // 释放副作用，幂等
```

## 核心概念与用法

### 信号 `signal`

```ts
const count = signal(0);
count.get(); // 读取当前值 → 0
count.set(1); // 整体替换
count.set((value) => value + 1); // 基于旧值计算

const unsubscribe = count.subscribe((value) => {
  console.log("changed:", value);
});
unsubscribe(); // 取消订阅，可重复调用
```

`signal` 返回一个 `Signal<T>`，包含：

| 成员            | 签名                                        | 说明                                             |
| --------------- | ------------------------------------------- | ------------------------------------------------ |
| `get()`         | `() => T`                                   | 读取值；在 `computed`/`effect` 内自动收集依赖。  |
| `set(value)`    | `(value: T) => void`                        | 整体替换整个值。                                 |
| `set(recipe)`   | `(recipe: (draft: T) => T \| void) => void` | 通过 draft 局部修改，或返回替换值。              |
| `subscribe(cb)` | `(cb: (value: T) => void) => () => void`    | 订阅后续变化，不立即调用回调，返回幂等取消函数。 |

可传入 `SignalOptions<T>`：

```ts
// 仅当 id 变化时才视为“变化”，保留旧对象引用
const user = signal(
  { id: 1, label: "a" },
  {
    equals: (a, b) => a.id === b.id,
  },
);
```

### 计算属性 `computed`

惰性、缓存、动态依赖追踪的只读信号：

```ts
const count = signal(1);
const doubled = computed(() => count.get() * 2);

doubled.get(); // 2，首次读取时惰性求值并缓存
count.set(4);
doubled.get(); // 8，仅在依赖变化后重新计算

// 只读：doubled.set(...) 在类型上被禁止
```

- **惰性**：只有被读取（`get`）且依赖已失效时才会重新计算。
- **缓存**：依赖未变化时不重算，结果相等（`equals`）时保留旧引用并跳过下游通知。
- **动态依赖**：分支切换后自动释放旧依赖，不再因旧分支变化而重算。
- **循环依赖**：检测到循环依赖时抛出 `Error("computed 存在循环依赖")`。
- **错误恢复**：计算回调抛错时会保留重试标志，可在下次读取或上游更新时恢复。

### 副作用 `effect`

```ts
const source = signal(0);
const dispose = effect(() => {
  const value = source.get();
  console.log("run:", value);
  // 返回清理函数：在下次重跑前与释放时执行
  return () => console.log("cleanup:", value);
});

source.set(1); // 同步输出 cleanup:0 → run:1
dispose(); // 输出 cleanup:1，幂等
```

- **首次同步执行**：`effect(fn)` 调用时立即同步运行一次。
- **同步重跑**：依赖变化后，在写入返回的 flush 阶段同步重跑（受 `batch` 合并约束）。
- **清理函数**：`fn` 返回的函数在重跑前执行一次，释放时再执行一次；清理与订阅中的读取**不**收集为依赖。
- **幂等释放**：返回的 `dispose` 可重复调用，多次调用安全。

### 批处理 `batch`

```ts
const count = signal(0);
const stop = effect(() => console.log(count.get())); // 先输出 0

batch(() => {
  count.set(1);
  count.set(2);
  // 批处理内部立即可读到新值，但 effect/通知推迟到最外层结束
});
// 仅输出：2（一次合并后的重跑）

// 返回回调结果，支持嵌套
const result = batch(() => {
  batch(() => count.set(10));
  return count.get() * 2;
});
```

- 合并通知与 effect，在最外层 `batch` 结束时统一刷新。
- 批处理**不是事务**：回调抛错也会刷新已提交的写入。
- `effect` / `computed` 的收集与批处理只在**同步回调期间**生效，不跨越 `await`。

### 作用域 `Scope`

`Scope` 是一个显式的值隔离容器：在同步回调期间将信号“重定向”到作用域内的覆盖值，作用域外仍读取原始值，不影响全局订阅。

```ts
import { createScope, runInScope, serializeScope, signal } from "@slux/core";

const count = signal(0);
const scope = createScope();

runInScope(scope, () => {
  scope.set(count, 10);
  scope.get(count); // 10（作用域覆盖值）
  count.get(); // 0（全局原始值不受影响）
});

// 子作用域动态继承父作用域
const child = scope.fork();
child.get(count); // 10，读取时动态继承父作用域
child.set(count, 20);
scope.get(count); // 仍是 10

// 只序列化本作用域显式赋值的条目，键对同一信号保持稳定
serializeScope(child); // { __scope_0: 20 }
```

`Scope` 接口：

| 成员                 | 签名                                  | 说明                                                 |
| -------------------- | ------------------------------------- | ---------------------------------------------------- |
| `fork()`             | `() => Scope`                         | 创建继承本作用域的子作用域。                         |
| `get(subscribable)`  | `<T>(s: Subscribable<T>) => T`        | 先读自身赋值，回退到父作用域，再回退到原始 `get()`。 |
| `set(signal, value)` | `<T>(s: Signal<T>, value: T) => void` | 在作用域内覆盖信号取值。                             |
| `serialize()`        | `() => Record<string, unknown>`       | 仅输出自身赋值的普通对象快照，不含继承值。           |

> 契约：`runInScope` 只设置同步上下文，**不改写** 信号 / 计算的读写行为；作用域赋值不触发全局订阅。序列化不负责 JSON 编码或恢复。跨 `await` 的异步上下文隔离由上层（如服务端适配层）负责。

## 信号写入语义

`set` 同时支持「整体替换」与「draft 修改」两种调用方式：

```ts
const count = signal(0);
count.set(1); // 整体替换
count.set((current) => current + 1); // 基于旧值计算

const user = signal({ name: "Alice", tags: ["reader"] });
user.set((draft) => {
  draft.name = "Bob"; // 局部修改对象
  draft.tags.push("writer"); // 局部修改数组
});
```

详细规则：

- **`set(value)`**：直接替换整个值，保留传入值的引用（不自动冻结、不深拷贝）。
- **`set(recipe)`**：接收当前值的 limu draft，可修改对象、数组、`Map` 或 `Set`；也可 `return` 一个替换值。
  - **无返回值** → 提交 draft 修改。
  - **无修改** → 跳过通知（新旧值相等判定）。
  - **回调抛错** → 不提交该次修改、不通知，可在之后继续正常写入。
  - **返回非 `undefined` 值** → 将其作为替换值。需要写入 `undefined` 时直接调用 `set(undefined)`。
- **基础类型通过返回值更新**，库不再提供 `update`。
- **函数参数始终被视为更新回调**；若要保存函数值本身，用 `callback.set(() => nextFunction)`，而非 `callback.set(nextFunction)`（后者会被当作更新回调执行）。
- 更新回调必须**同步执行**；回调内部的响应式读取不会被收集为外层依赖。
- draft 修改不影响旧快照，未修改的分支保持原引用（结构共享）。

```ts
const value = signal<{ count: number } | undefined>({ count: 1 });
value.set(() => ({ count: 2 })); // 返回替换值
value.set(undefined); // 写入 undefined
value.get(); // undefined
```

## 响应式语义

- **依赖收集**：`get()` 在 `computed`/`effect` 内自动收集依赖；分支切换后释放旧依赖，仅跟踪当前实际读取的源。
- **相等判定**：默认使用 `Object.is`（因此 `NaN` 视为相等，`0` 与 `-0` 视为不同、会触发通知）。可传入 `equals` 自定义。派生结果相等时，保留旧引用并跳过下游计算与通知。
- **不可变容器**：limu 负责值容器与 draft 的不可变提交。直接传入的对象和集合保持引用、**不自动冻结**；直接修改 `get()` 返回对象的内部属性**不会**触发通知（应通过 `set` 的 draft 修改）。
- **订阅时机**：`subscribe` 不立即调用回调。`signal` 在写入完成时通知；`computed` 保持惰性订阅语义，只有被读取并计算出变化值时才通知（首次成功计算也算一次变化）。存在 `effect` 读取时，通知随 effect 的刷新一并发生。
- **普通写入同步完成**：单次 `set` 在返回前完成通知与 effect 重跑。批处理内立即可读到新值，最外层结束后合并执行。
- **清理与依赖**：`effect` 可返回清理函数，在重跑前及释放时执行；订阅与清理函数中的读取不收集响应式依赖。
- **错误处理**：某次通知或 effect 抛错后，其余待执行任务仍会运行；单个错误原样抛出，多个错误通过 `AggregateError` 汇总。`computed` 抛错后可在下次读取或更新时恢复。
- **同步边界**：`computed` 回调同步且无副作用；`effect` 与 `batch` 只在同步回调期间工作，不跨 `await` 收集依赖或保持批处理。

## 自动导入

`createAutoImportApis` 生成 `unplugin-auto-import` 所需的 `ImportsMap`，把全部核心 API（`signal`、`computed`、`effect`、`batch`、`createScope`、`runInScope`、`serializeScope`）注册为可自动导入的标识符，无需手写 `import`。

```ts
// vite / rspack / rollup 等支持 unplugin 的构建配置
import AutoImport from "unplugin-auto-import/webpack"; // 或对应平台的入口
import { createAutoImportApis } from "@slux/core";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

- 调用 `createAutoImportApis()` 默认无前缀；传入字符串前缀可生成带前缀的别名（如 `createAutoImportApis("u")` → `uSignal`、`uComputed`，具体大写规则见 `@slux/shared` 的 `createAutoImports`）。
- 生成的配置来源名为 `@slux/core`，与包名一致。

## API 速查表

| API                              | 行为                                             |
| -------------------------------- | ------------------------------------------------ |
| `signal(initialValue, options?)` | 可写信号，支持 `get` / `set` / `subscribe`。     |
| `computed(fn, options?)`         | 惰性计算、缓存、动态依赖追踪，返回只读信号。     |
| `effect(fn)`                     | 首次同步执行，变化后同步重跑，返回幂等释放函数。 |
| `batch(fn)`                      | 合并通知和 effect，返回回调结果，支持嵌套。      |
| `createScope()`                  | 创建一个值隔离容器。                             |
| `runInScope(scope, fn)`          | 在同步回调期间切换作用域上下文。                 |
| `serializeScope(scope)`          | 返回作用域自身赋值的普通对象快照。               |
| `createAutoImportApis(prefix?)`  | 生成核心 API 的 `unplugin-auto-import` 配置。    |

## 类型参考

```ts
// 可被订阅的只读响应式单元
type Subscribable<T> = {
  get(): T;
  subscribe(callback: (value: T) => void): () => void;
};

// 只读信号（派生结果）
type ReadonlySignal<T> = Subscribable<T>;

// 可写信号
type Signal<T> = ReadonlySignal<T> & {
  set(recipe: (draft: T) => T | void): void;
  set(value: T): void;
};

// 信号选项：自定义相等判定
type SignalOptions<T> = {
  readonly equals?: (a: T, b: T) => boolean;
};

// 作用域：显式的值隔离容器
type Scope = {
  fork(): Scope;
  get<T>(subscribable: Subscribable<T>): T;
  set<T>(signal: Signal<T>, value: T): void;
  serialize(): Record<string, unknown>;
};
```

公开导出的类型：`Subscribable`、`ReadonlySignal`、`Signal`、`SignalOptions`、`Scope`。

## 依赖与产物

- **运行时依赖**：`@slux/shared` 提供 `runAll` 等通用工具；`limu` 是必需的 peer 依赖，用于 draft 提交。两者都由产物外部引用。
- **构建依赖**：本仓库在开发依赖中安装 `limu` 供构建和测试，产物只包含 `core/src` 的实现，不内联第三方源码。本仓库对 `limu@4.2.1` 的 `Map` 假值键补丁不会随 peer 依赖传播；需要该行为的使用方须在自身项目应用[同一补丁](../../patches/README.md)。
- **职责边界**：依赖追踪、调度与作用域都属于 `core`；`shared` 只提供通用工具。
- **产物**：`dist/index.js`（ESM）、`dist/index.cjs`（CJS）、`dist/index.d.ts` 与 `dist/index.d.cts`（类型），由 `rstack`（`rs lib`）构建。

## 本地开发

仓库内统一的安装、构建、测试、类型检查与格式化命令见仓库根 [README 的「本地开发」一节](../../README.md)，本包不重复列出。

## 许可证

[MIT](../../LICENSE) © itmanyong
