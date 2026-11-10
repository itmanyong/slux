# @slux/flux

基于 `@slux/core` 的 reducer + dispatch 状态范式层。内部只持有一个 core `Signal<State>` 作为状态与通知源：`dispatch(action)` 同步经过中间件链与 reducer，把 reducer 返回的完整新状态写入该 signal；依赖追踪、批处理与相等性判定全部复用 core。**不依赖 Redux，也不是 Redux 的兼容实现**。

## 特性与适用场景

| 场景                                                       | 是否适合 | 说明                                                                       |
| ---------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| 状态流转适合写成 `(state, action) => state`，action 可枚举 | 适合     | 状态与 action 类型由 `FluxReducer` 约束，reducer 返回完整新状态            |
| 需要在派发前/后拦截、替换或阻断 action                     | 适合     | `options.middleware` 是独立的 dispatch 管道                                |
| 想和 `computed` / `effect` / `batch` 组合                  | 适合     | `FluxStore` 满足 core 的 `Subscribable<State>`                             |
| 需要细粒度字段订阅、浅合并、draft 草稿修改                 | 不适合   | 本包是整状态替换，见「关键语义与边界」；改用 `@slux/store` / `@slux/proxy` |
| 需要 thunk、异步 action、内置持久化或时间旅行              | 不适合   | 本包不内置，异步完成后自行派发普通 action                                  |

## 安装

```sh
pnpm add @slux/flux
```

| 项                 | 值                                                                     | 来源                     |
| ------------------ | ---------------------------------------------------------------------- | ------------------------ |
| 版本               | `0.1.0`                                                                | `package.json`           |
| `dependencies`     | `@slux/core` `workspace:*`、`@slux/shared` `workspace:*`               | `package.json`           |
| `peerDependencies` | 无                                                                     | `package.json`           |
| 模块格式           | ESM（`dist/index.js`）+ CJS（`dist/index.cjs`），带 `.d.ts` / `.d.cts` | `package.json` `exports` |
| 许可               | MIT                                                                    | `package.json`           |

`@slux/core`、`@slux/shared` 是本包 `dependencies`，安装时一并带入；下文示例直接 `import` 了 `@slux/core` 的 `computed` / `batch`，**应用代码直接 import 的依赖应显式声明**，可写成 `pnpm add @slux/core @slux/flux`。Node.js 版本要求与跨包通用约定见仓库根 [README.md](../../README.md)。

## 快速开始

```ts
import { batch, computed } from "@slux/core";
import { createFluxStore, type FluxReducer } from "@slux/flux";

type State = { count: number };
type Action = { type: "add"; amount: number } | { type: "reset" };

const reducer: FluxReducer<State, Action> = (state, action) => (action.type === "add" ? { count: state.count + action.amount } : { count: 0 });

const store = createFluxStore(reducer, { count: 0 });
const doubled = computed(() => store.get().count * 2);
const stop = store.subscribe((state) => console.log("count:", state.count));

batch(() => {
  store.dispatch({ type: "add", amount: 1 });
  store.dispatch({ type: "add", amount: 2 });
}); // 订阅只收到 count: 3

console.log(doubled.get()); // 6
stop();
store.destroy();
```

## 核心 API

`createFluxStore<State, Action extends FluxAction>(reducer, initialState, options?): FluxStore<State, Action>`

`FluxAction` 即 `{ readonly type: string }`。`reducer` 是 `(state, action) => State`，`initialState` 是初始状态，`options.middleware` 是可选的只读中间件数组。返回值满足 `Subscribable<State>`，可放进 core 的依赖图。

### `FluxStore<State, Action>` 方法

| 方法                  | 签名                                         | 行为                                                                                 |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `get()`               | `() => State`                                | 返回当前状态；在 `computed` / `effect` 内读取会收集依赖                              |
| `getState()`          | `() => State`                                | 与 `get()` 是同一个函数                                                              |
| `getInitialState()`   | `() => State`                                | 返回创建时传入的初始状态引用，不随 `dispatch` 改变                                   |
| `subscribe(callback)` | `(cb: (state: State) => void) => () => void` | 订阅**后续**变化，不立即调用；回调只接收当前状态（无 `prevState`）；返回幂等取消函数 |
| `dispatch(action)`    | `(action: Action) => Action`                 | 同步经过中间件链与 reducer；默认返回原 action，中间件可返回另一个 `Action`           |
| `destroy()`           | `() => void`                                 | 幂等；取消本实例全部订阅，之后 `dispatch` 被忽略、新增订阅为空实现，读取仍可用       |

### 状态与 reducer 语义

| 规则     | 说明                                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 完整替换 | reducer 返回**完整新状态**，不浅合并旧字段、不接收可修改草稿、不应原地修改旧状态                                              |
| 初始化   | 直接采用 `initialState`，**不会**用内部虚构 action 调用 reducer                                                               |
| 状态类型 | 支持基础值、对象、`undefined` 与函数；函数状态通过 `source.set(() => nextState)` 作为返回值写入，不会被 core 当成 recipe 执行 |
| 相等判定 | 沿用 core 默认 `Object.is`：`NaN` 视为相等、`0` 与 `-0` 视为不同；与旧状态相同则不通知                                        |

### Dispatch 中间件

`FluxMiddleware<State, Action>` 的形式是 `api => next => action => Action`。

```ts
import { createFluxStore, type FluxMiddleware } from "@slux/flux";

type Action = { type: "add"; amount: number };
const doublePositive: FluxMiddleware<number, Action> = () => (next) => (action) =>
  action.amount <= 0 ? action : next({ ...action, amount: action.amount * 2 });

const store = createFluxStore((state: number, action: Action) => state + action.amount, 0, { middleware: [doublePositive] });
store.dispatch({ type: "add", amount: 2 }); // 4
store.dispatch({ type: "add", amount: -1 }); // 被阻断，仍为 4
```

| 约定                   | 说明                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| `api.getState()`       | 读取当前状态                                                         |
| `api.dispatch(action)` | 始终重新进入**完整**中间件链，不是从当前 `next` 之后开始             |
| `next(action)`         | 交给下一环，最内层是 reducer 提交；省略 `next` 即阻断本次提交        |
| 顺序                   | 数组第一项在最外层：`A before → B before → 写入 → B after → A after` |
| 返回值                 | 中间件可拦截、替换 action 或返回另一个合法 `Action`                  |

该契约与 `@slux/store` 的**状态写入中间件不兼容**，两者不能互换。中间件初始化期间禁止 `dispatch`（管道尚未组装完毕，会抛错）。本包不内置 thunk、异步 action 或持久化。

## 关键语义与边界

- **依赖收集**：`get()` / `getState()` 就是 core `signal.get`，在 `computed` / `effect` 内读取会收集依赖；**仅调用 `dispatch` 不会**把 `effect` 订阅到 Flux 状态。
- **通知时机**：`dispatch → 中间件 → reducer → signal.set → core 通知`。`subscribe` 不立即调用回调；单次 `dispatch` 在返回前同步完成通知。
- **批处理**：`@slux/core` 的 `batch` 可合并多次 `dispatch` 的通知；批内读取立即得到最新状态，批次结束只通知最终值。订阅回调没有 `prevState` 参数。
- **错误**：
  - reducer 抛错 → 不提交状态、不通知，`reducing` 锁在 `finally` 中释放，之后仍可正常派发。
  - reducer 执行期间递归 `dispatch` → 抛 `Error("Cannot dispatch while the reducer is executing")`。
  - 中间件初始化期间 `dispatch` → 抛 `Error("Cannot dispatch while middleware is initializing")`。
  - 订阅回调抛错 → 不回滚已提交状态、不阻断其他回调，错误向调用方抛出。
- **订阅回调可再次 `dispatch`**：通知阶段 `reducing` 已复位，新通知由 core 在当前轮结束后继续派发；监听器内 `destroy()` 可终止本轮余下通知。
- **清理**：`destroy()` 取消本实例订阅、清除批内待派发通知；**外部创建的 `computed` / `effect` 仍由调用方清理**。销毁后 `dispatch` 静默忽略（返回原 action），异步任务不会自动取消，其完成后的 `dispatch` 无效。
- **异步**：不内置 thunk 或异步 action；异步工作完成后派发普通 action 即可，中间件自行持有的外部资源由调用方清理。

## 自动导入

`createAutoImportApis(prefix?)` 返回 `unplugin-auto-import` 的 `ImportsMap`。登记清单以 `src/auto-import-api.ts` 的 `allImportApis` 为准，当前只有 `createFluxStore`，来源名为 `@slux/flux`（`createAutoImportApis` 本身不登记）。

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/flux";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

默认无前缀；传入**以小写字母结尾**的前缀时，别名会把 API 名首字母大写（如 `createAutoImportApis("u")` → `uCreateFluxStore`）。大小写规则由 `@slux/shared` 的 `generateBatchAutoImports` / `createAutoImports` 决定。

## 类型导出

以 `src/index.ts` 的 `export type` 为准，共 7 个：

| 类型                               | 用途                                                                                                           |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `FluxAction`                       | `{ readonly type: string }`，action 的基础约束                                                                 |
| `FluxReducer<State, Action>`       | `(state, action) => State`                                                                                     |
| `FluxDispatch<Action>`             | `(action: Action) => Action`                                                                                   |
| `FluxMiddlewareAPI<State, Action>` | 中间件可见的 `{ getState(): State; dispatch: FluxDispatch<Action> }`                                           |
| `FluxMiddleware<State, Action>`    | `api => next => dispatch` 的中间件定义                                                                         |
| `FluxStore<State, Action>`         | `createFluxStore` 返回类型：`Subscribable<State>` 加上 `getState` / `getInitialState` / `dispatch` / `destroy` |
| `FluxStoreOptions<State, Action>`  | `{ readonly middleware?: readonly FluxMiddleware<State, Action>[] }`                                           |

## 不适用的场景 / 与其他包分工

- 与 `@slux/core`：core 是响应式运行时（signal / computed / effect / batch / Scope）；本包只叠加 reducer + dispatch 范式层。
- 与 `@slux/store`：store 是「状态与 action 同对象 + 浅合并 + 状态写入中间件」；本包是「整状态替换 + dispatch 管道中间件」，**两套中间件契约互不兼容**。
- 需要细粒度字段订阅或草稿式局部修改，用 `@slux/store` / `@slux/proxy`；需要 Redux DevTools、时间旅行不在本包范围。
- 框架绑定只读本实例、写入仍走 `dispatch(action)` 等通用约定见仓库根 [README.md](../../README.md) 的「框架适配 · 通用约定」一节。

## 版本、许可与反馈

- 版本：`0.1.0`（`package.json`）。
- 许可：MIT，见仓库根 [LICENSE](../../LICENSE)。
- 问题反馈：`https://github.com/itmanyong/slux/issues`（`package.json` `bugs.url`）。
