# @slux/store

🗃️ 把**关联状态与 action 放在同一个对象**里管理。读写、批处理与派生依赖复用 `@slux/core` 的响应式运行时，本包只提供 Store 范式层：一个 `createStore`、一组类型、一条可选中间件链。

[![GITHUB](https://img.shields.io/badge/GITHUB-181717?style=for-the-badge&logo=github&logoColor=white&color=green)](https://github.com/itmanyong/slux/tree/main/packages/store) [![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white&color=orange)](https://www.npmjs.com/package/@slux/store) [![在线文档](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E6%96%87%E6%A1%A3-0F766E?style=for-the-badge&color=blue)](https://itmanyong.github.io/slux/packages/store/)

| 💡 项        | 值                                                                     | 来源                          |
| ------------ | ---------------------------------------------------------------------- | ----------------------------- |
| 包名 / 版本  | `@slux/store` `0.2.4`                                                  | `package.json`                |
| 模块格式     | ESM（`dist/index.js`）+ CJS（`dist/index.cjs`），带 `.d.ts` / `.d.cts` | `package.json` `exports`      |
| 运行时依赖   | `@slux/core`、`@slux/shared`                                           | `package.json` `dependencies` |
| 许可 / 仓库  | MIT / `github.com/itmanyong/slux`（`packages/store`）                  | `package.json`                |
| 文档更新日期 | 2026-11-10                                                             | 本次编写                      |
| 文档状态     | 已对照当前源码核对；`test`、`typecheck` 已实际运行通过                 | 见「验证方式」                |

> 💡 本文面向**使用库的开发者**，只描述本包的公开 API 与专属边界；跨包通用约定见仓库根 [README](../../README.md)。

## 目录

- [快速开始](#快速开始)
- [目录结构](#目录结构)
- [架构与数据流](#架构与数据流)
- [API](#api)
- [中间件](#中间件)
- [自动导入](#自动导入)
- [作用域边界](#作用域边界)
- [类型导出](#类型导出)
- [术语表](#术语表)
- [FAQ](#faq)
- [验证方式](#验证方式)
- [版本、许可与贡献](#版本许可与贡献)
- [边界与待确认](#边界与待确认)

## 快速开始

### 1. 什么时候用它

| 🧭 场景                                                   | 是否适合 | 说明                                                 |
| --------------------------------------------------------- | -------- | ---------------------------------------------------- |
| 一组字段 + 操作这些字段的 action 要放在一起               | 适合     | `createStore(creator)` 返回的对象同时含数据与 action |
| 想用 `computed` / `effect` / `batch` 组合多个范式包的状态 | 适合     | Store 满足 `Subscribable<T>`，可放进 core 的依赖图   |
| 需要日志、持久化、撤销、跨标签同步                        | 适合     | 通过 `options.middleware` 接入（见「中间件」）       |
| 需要细粒度字段订阅、深合并或草稿式修改                    | 不适合   | 本包是浅合并、整对象失效，见「状态更新」             |
| 需要自动的请求级作用域隔离                                | 不适合   | 见「作用域边界」                                     |

### 2. 安装

```sh
pnpm add @slux/core @slux/store
```

`@slux/core` 与 `@slux/shared` 是本包的 `dependencies`，安装时会一并带入；上例显式写出 `@slux/core`，是因为后续示例直接使用了它的 `batch` / `computed` / `effect`，**应用代码直接 import 的依赖应显式声明**。Node.js 需 >= 24（仓库根 `package.json` 的 `engines`）。

> 💡 边界：`package.json` 配置了 `publishConfig.access: public` 与 npm `homepage`，但**本包是否已实际发布到 npm、以及线上版本号，无法从源码确认**。若 `pnpm add` 失败，请改用下方「从源码验证」。

### 3. 最小可运行示例

保存为 `demo.mjs`，在已安装依赖的项目中执行 `node demo.mjs`：

```js
import { createStore } from "@slux/store";

const counter = createStore((set, get) => ({
  count: 0,
  increment: () => set({ count: get().count + 1 }),
  reset: () => set({ count: 0 }),
}));

const stop = counter.subscribe((state, prevState) => {
  console.log(`${prevState.count} -> ${state.count}`);
});

counter.getState().increment(); // 通知一次
counter.setState({ count: 5 }); // 通知一次
console.log(counter.getState().count);
stop();
counter.destroy();
```

预期输出（`subscribe` 不立即通知，所以没有初始值那一行）：

```text
0 -> 1
1 -> 5
5
```

### 4. TypeScript 写法

```ts
import { createStore } from "@slux/store";

interface CounterState {
  count: number;
  increment(): void;
  reset(): void;
}

const counter = createStore<CounterState>((set, get) => ({
  count: 0,
  increment: () => set({ count: get().count + 1 }),
  reset: () => set({ count: 0 }),
}));

counter.setState((state) => ({ count: state.count + 1 })); // updater 返回部分状态
counter.getState().reset();
```

不含 action 的状态可直接从 creator 返回值推断；action 之间相互引用时，显式传入状态类型可让 `set`、`get` 和 action 参数都有完整类型。`interface` 可用，无需字符串索引签名。`T extends object`，不能传原始值。

### 5. 在仓库内从源码验证

```sh
pnpm install
pnpm --filter @slux/store... build
pnpm --filter @slux/store test
pnpm --filter @slux/store typecheck
```

`--filter @slux/store... build` 会连同依赖包一起构建；`test` 覆盖上面示例的订阅、浅合并、批处理等行为，`typecheck` 覆盖 `__tests__/index.type-test.ts` 的类型约束。

## 目录结构

🗂️ 与当前源码一致（`dist/` 是构建产物，当前仓库中尚未生成，也不在版本控制里）：

```text
packages/store/
├── README.md                     本文：面向使用者的 API 与边界
├── package.json                  包元信息、exports、脚本、依赖
├── rstack.config.ts              继承仓库 sharedLibConfig + sharedTestConfig，附 lint 规则
├── tsconfig.json                 开发/类型检查配置（含 src、__tests__）
├── tsconfig.build.json           构建配置（rootDir=src，仅打包 src）
├── src/
│   ├── index.ts                  公开出口：createStore、createAutoImportApis、9 个类型
│   ├── types.ts                  全部公开类型定义
│   ├── create-store.ts           唯一实现：两阶段初始化 + 中间件链 + 通知分发
│   └── auto-import-api.ts        unplugin-auto-import 配置生成
└── __tests__/
    ├── create-store.test.ts      14 项运行时行为测试
    ├── middleware.test.ts        13 项中间件行为测试
    └── index.type-test.ts        仅由 typecheck 编译的类型用例
```

## 架构与数据流

```text
调用方
  │  setState(partial | updater) / get() / getState() / subscribe() / destroy()
  ▼
@slux/store（范式层，本包）
  │  updater 求值 → 中间件 onSet 链 → Object.assign 浅合并 → signal.set
  ▼
@slux/core（响应式运行时）
  │  signal 版本递增 / batch 合并 / computed 与 effect 依赖追踪 / 通知队列
  ▼
@slux/shared（纯工具）
     runAll：执行全部同步任务并汇总错误
```

🗂️ 三条要点：

1. **Store 不自建响应式图**。内部持有一个 `Signal<T>` 作为唯一通知源，因此 `get()` 在 `computed` / `effect` 内读取会自动收集依赖，多次写入可被 `batch` 合并。
2. **写入是「浅合并 + 新引用」**。每次成功写入都 `Object.assign({}, current, partial)` 生成新对象，交给 signal；因为引用变了，即使传 `{}` 或相同值也会通知。
3. **Store 没有 selector 参数**。细粒度订阅用 `computed(() => store.get().某字段)` 包一层，由 computed 的结果相等性过滤无关更新。

完整写入路径、读取路径、初始化路径与销毁路径的约定见上文「架构与数据流」与「API」两节。

## API

`createStore<T extends object>(creator: StateCreator<T>, options?: StoreOptions<T>): StoreApi<T>`

🧩 creator 接收 `(set, get)` 并返回初始状态对象；`options.middleware` 是可选的只读中间件数组。

### `StoreApi<T>` 方法

| 💡 方法                      | 行为                                                                  |
| ---------------------------- | --------------------------------------------------------------------- |
| `get()`                      | 返回当前状态；在 `computed` / `effect` 内读取会收集依赖               |
| `getState()`                 | 与 `get()` 相同（同一个函数）                                         |
| `setState(partialOrUpdater)` | 接收部分状态，或返回部分状态的 `(state) => partial`                   |
| `subscribe(listener)`        | 监听**后续**变化，回调 `(state, prevState)`，返回取消函数；不立即通知 |
| `getInitialState()`          | 返回 creator 返回的初始对象引用，即使中间件 `init` 期间更新也不改变   |
| `destroy()`                  | 停止写入、移除订阅并执行中间件清理；可重复调用                        |

`StoreApi<T>` 满足 core 的 `Subscribable<T>`，也接受只用一个参数的订阅回调；它**不暴露** `Signal.set`。

### 状态更新

| 写法                                                | 结果                                                         |
| --------------------------------------------------- | ------------------------------------------------------------ |
| `setState({ count: 1 })`                            | 只合并第一层，`count` 被替换，未出现的字段与 action 保留     |
| `setState({ user: { name: "Bob" } })`               | 嵌套对象整体替换，不做深合并                                 |
| `setState((state) => ({ count: state.count + 1 }))` | updater 收到当前状态（**不是可修改草稿**），必须返回部分状态 |
| `setState({})`                                      | 仍生成新对象并通知一次                                       |

updater 与 core 的 `signal.set(recipe)` 草稿写入接口不同：直接 `state.count++` 不会生效，且类型检查会报错。直接修改 `getState()` 或 `getInitialState()` 返回的对象不会触发通知；它们没有额外冻结，也不是深拷贝。

creator 执行期间可先 `set` 构造临时状态再 `get` 读取；这些写入绕过中间件，且**最终初始状态以 creator 的返回值为准**。在第一次 `set` 之前调用 `get()` 读到的是 `undefined`（运行时值，尽管类型标注为 `T`），因此 creator 内的 updater 也必须先有状态才能读字段。action 在 creator 返回后调用时读取最新状态。

### 批处理与选择器

```ts
import { batch, computed, effect } from "@slux/core";
import { createStore } from "@slux/store";

const counter = createStore(() => ({ count: 0, name: "a" }));
const doubled = computed(() => counter.get().count * 2);
const stopSelected = doubled.subscribe((value) => console.log("doubled", value));
const stopEffect = effect(() => console.log("name", counter.getState().name));

batch(() => {
  counter.setState({ count: 1 });
  counter.setState((state) => ({ count: state.count + 1 }));
  console.log(counter.getState().count); // 2（批次内立即可读）
}); // 批次结束才通知一次，prevState 为批次前状态

counter.setState({ name: "b" }); // effect 重跑；doubled 结果没变，不通知
stopSelected();
stopEffect();
counter.destroy();
```

批次内立即可读到最新状态；订阅在批次结束时收到最终状态和批次前的状态。注意：`store.get()` 是**整对象级**依赖，任意字段更新都会让读取它的 `effect` 重跑；只有经 `computed` 包一层后，才会按结果值是否变化过滤通知。Store 本身没有 selector 参数。

通知期间新订阅的监听器从下一次通知开始参与，已取消的监听器不会继续执行；监听器内的写入在当前轮通知结束后继续派发；监听器抛错不阻断同轮其他监听器，错误在通知完成后向调用方抛出。

### 异步 action 与切片

action 可以是普通异步函数；`await` 后用 `get()` 读最新状态再 `set()` 更新。Store **不自动取消异步任务**，销毁后的 `set` 会被忽略。多个切片可共用同一组 `SetStateFn<AppState>` / `GetStateFn<AppState>`，在 creator 返回值中展开合并，无需额外的切片注册机制。

## 中间件

```ts
import { createStore, type Middleware } from "@slux/store";

type State = { count: number };

const logger: Middleware<State> = {
  name: "logger",
  onSet(api, next, partial) {
    console.log("before", api.getState());
    next(partial);
    console.log("after", api.getState());
  },
};

const store = createStore<State>(() => ({ count: 0 }), {
  middleware: [logger],
});
```

| 钩子                         | 时机与约定                                                                 |
| ---------------------------- | -------------------------------------------------------------------------- |
| `init(api)`                  | Store 完整可用后按数组顺序调用；此时写入经过完整中间件链                   |
| `onSet(api, next, partial)`  | updater 已解析为部分状态；可转换数据、调用 `next` 继续，或省略 `next` 阻断 |
| `onSubscribe(api, listener)` | 注册时包装监听器，返回 `(state, prevState) => void`                        |
| `onDestroy(api)`             | 销毁时按数组顺序执行资源清理                                               |
| `onGet(api, key)`            | **保留的兼容接口，当前 Store 不调用**                                      |

💡 `onSet` 的第一个中间件在最外层：`A before → B before → 写入 → B after → A after`；`onSubscribe` 从数组末尾开始构建包装器，实际通知时第一个中间件同样在最外层。中间件收到的 `MiddlewareAPI<T>` 含 `getState`、`setState`、`getInitialState`、`subscribe`；`setState` 始终重新进入完整写入链，所以在 `onSet` 中传递当前更新要用 `next`。

初始化抛错时，清理所有已进入初始化阶段的中间件（含抛错的那个），并关闭已捕获 API 的写入与订阅能力；未进入初始化阶段的中间件不执行清理。销毁时先停止写入、断开通知，再执行全部清理钩子；某个钩子抛错不阻止其他钩子执行，单个错误原样抛出、多个错误用 `AggregateError` 保留。写入已提交后，监听器或中间件抛错**不会回滚状态**。

销毁后仍可读取最后状态和初始引用；保存的 `next` 也不能再次提交更新。Store 不负责释放调用方创建的 `effect` 或其他外部资源。**每个 Store 应创建自己的中间件实例，不要跨 Store 复用同一个实例**（仓库根 README 的通用契约）。

现成的中间件包：`@slux/devtools`（日志/检查）、`@slux/storage`（持久化）、`@slux/history`（撤销重做）、`@slux/tab-sync`（跨标签同步）、`@slux/telemetry`（统计）。

## 自动导入

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/store";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

🔌 `createAutoImportApis(prefix?)` 返回 `unplugin-auto-import` 的 `ImportsMap`，当前登记的 API 是 `createStore`。传入前缀可生成别名（如 `createAutoImportApis("u")` → `uCreateStore`），大写规则由 `@slux/shared` 的 `createAutoImports` 决定。

## 作用域边界

⚠️ core 的 `Scope` 是「显式值覆盖容器」：`scope.get(store)` 可通过 `Subscribable` 读取 Store，但 `scope.set` 要求 `Signal<T>`，而 `StoreApi` 没有 `set` 方法。`runInScope(scope, () => store.setState(...))` 仍更新原 Store，**不会自动隔离请求状态**。

需要请求隔离时，为每个请求创建独立 Store 实例，并在请求生命周期结束时 `destroy()`。

## 类型导出

| 类型                                 | 用途                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `StoreApi<T>`                        | `createStore` 返回类型；等价于 `Omit<Subscribable<T>, "subscribe"> & MiddlewareAPI<T> & { destroy(): void }` |
| `StateCreator<T>`                    | `(set, get) => T`                                                                                            |
| `SetStateFn<T>`                      | 接受部分状态**或 updater** 的写入函数                                                                        |
| `GetStateFn<T>`                      | `() => T`                                                                                                    |
| `Listener<T>`                        | `(state, prevState) => void`                                                                                 |
| `SetFn<T>`                           | 中间件链使用的 `(partial: Partial<T>) => void`，**不接收 updater**                                           |
| `Middleware<T>` / `MiddlewareAPI<T>` | 中间件定义与它可见的 API                                                                                     |
| `StoreOptions<T>`                    | `{ readonly middleware?: readonly Middleware<T>[] }`                                                         |

## 术语表

| 术语              | 含义                                                      |
| ----------------- | --------------------------------------------------------- |
| creator           | 传给 `createStore` 的初始化函数，返回初始状态对象         |
| action            | 存在状态对象里的函数，通过 `getState().xxx()` 调用        |
| partial / updater | 部分状态对象 / 返回部分状态的函数，都是 `setState` 的入参 |
| 浅合并            | `Object.assign({}, 当前状态, partial)`，只合并第一层      |
| 通知              | 一次 `subscribe` 回调派发，参数 `(state, prevState)`      |
| 批处理            | `batch()` 内多次写入合并为一次通知                        |
| 中间件            | 包装写入、订阅与销毁生命周期的钩子对象                    |
| `Subscribable<T>` | core 的只读可订阅契约：`get()` + `subscribe(cb)`          |

## FAQ

💡 **Q：`setState((state) => { state.count++ })` 为什么没生效？**
A：updater 必须**返回**部分状态；Store 不提供草稿写入。写 `setState((state) => ({ count: state.count + 1 }))`。core 的 `signal.set(recipe)` 才接受草稿 recipe，两者不要混用。

**Q：传 `{}` 为什么也触发订阅？**
A：写入总是 `Object.assign` 生成新引用，signal 的 `Object.is` 比较判定为变化，因此必定通知。需要过滤请用 `computed` 按结果值订阅。

**Q：为什么改了 `name`，读 `count` 的 `effect` 也重跑了？**
A：`store.get()` 依赖的是整个 signal，任意写入都使它失效。把 `computed(() => store.get().count)` 作为依赖，结果不变时不会向下游通知。

**Q：嵌套对象怎么局部更新？**
A：Store 只做浅合并，需要自己展开：`setState((s) => ({ user: { ...s.user, name: "Bob" } }))`。

**Q：destroy 之后还能读状态吗？异步 action 会被取消吗？**
A：能读最后状态和初始引用；写入被忽略。异步任务不会自动取消，`await` 后的 `set` 静默失效，需要自己在业务侧判断。

**Q：`onGet` 写了但没被调用？**
A：当前实现不拦截属性读取，`onGet` 只是保留的兼容接口。

**Q：怎么让 `runInScope` 隔离 Store？**
A：做不到，见「作用域边界」；请按请求建独立 Store。

## 验证方式

| 命令（仓库根目录执行）                | 覆盖内容                                 | 本次结果                 |
| ------------------------------------- | ---------------------------------------- | ------------------------ |
| `pnpm --filter @slux/store test`      | 27 项运行时行为（2 个测试文件）          | 通过：2 files / 27 tests |
| `pnpm --filter @slux/store typecheck` | `src` 与 `index.type-test.ts` 的类型约束 | 通过，无输出             |
| `pnpm --filter @slux/store... build`  | 连同依赖构建 `dist`                      | **本次未运行**           |

🧪 示例中的订阅、浅合并、批处理、选择器结论与 `__tests__/create-store.test.ts` 的断言一致；中间件链、错误聚合、销毁语义与 `__tests__/middleware.test.ts` 一致。

## 版本、许可与贡献

- 版本：`0.2.4`（`package.json`）；发布日期与 npm 上的可用版本无法从源码确认。
- 许可：MIT，见仓库根 [LICENSE](../../LICENSE)。
- 问题反馈：[GitHub Issues](https://github.com/itmanyong/slux/issues)。
- 贡献：按仓库根流程走（`changeset` + PR），本地改动提交前需通过 `lint` / `fmt` / `typecheck` / `test`；根 `package.json` 配置了 `lint-staged` 与 `simple-git-hooks`。

## 边界与待确认

1. **仓库中未提供独立的技术方案文档**：`package.json` 的 `files` 白名单只有 `dist`、`README.md`、`package.json`，本文自成完整说明，不引用仓库内其他设计文档。
2. **npm 发布状态未验证**：安装命令基于 `package.json` 的发布配置推断；本环境未查询 registry。
3. **构建产物未验证**：本次未运行 `build`，`dist/` 当前不存在；ESM/CJS 入口说明来自 `exports` 字段，不是实际产物检查。
4. **自动导入清单与入口导出数不一致**：`src/auto-import-api.ts` 的 `allImportApis` 目前只登记 `createStore`，而 `src/index.ts` 有两个运行时导出（`createStore`、`createAutoImportApis`）；生成脚本 `scripts/generate-import-apis.mjs` 按入口重新生成该数组。是否对齐属于源码改动，本次未处理。
5. 本包目录当前在 Git 中是未跟踪状态（`?? packages/store/`），文档未涉及任何提交或发布操作。

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
