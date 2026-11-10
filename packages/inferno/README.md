# @slux/inferno

🔌 Inferno 10（`inferno@^10.0.0`）的 slux 绑定，基于 `@slux/core` 的 `Subscribable<T>` 订阅模型。原生绑定形式是 **原生 class 组件生命周期管理订阅 + render prop 输出值**：所有读取组件都接受 `children: (value) => InfernoNode`，由内部 `Observer` 基类在挂载、更新、卸载时管理订阅。所有写入仍走原实例，绑定只读。

[![GITHUB](https://img.shields.io/badge/GITHUB-181717?style=for-the-badge&logo=github&logoColor=white&color=green)](https://github.com/itmanyong/slux/tree/main/packages/inferno) [![NPM](https://img.shields.io/badge/NPM-CB3837?style=for-the-badge&logo=npm&logoColor=white&color=orange)](https://www.npmjs.com/package/@slux/inferno) [![文档](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E6%96%87%E6%A1%A3-0F766E?style=for-the-badge&color=blue)](https://itmanyong.github.io/slux/packages/inferno/)

## 特性与适用场景

| 🧩 项    | 说明                                                                                   |
| -------- | -------------------------------------------------------------------------------------- |
| 绑定形式 | class 组件 + `children: (value) => InfernoNode` render prop                            |
| 框架依赖 | `inferno` 的 `Component` / `InfernoNode`，以及原生 legacy context（`getChildContext`） |
| 范式覆盖 | core 主入口 + atom / store / proxy / flux / state-machine / rxjs 六个子入口            |
| SSR      | `renderToString` 不挂载、不订阅；`ScopeProvider` 提供覆盖首屏值，支持 hydration        |

| 🧭 场景                                                               | 是否适合 | 说明                                            |
| --------------------------------------------------------------------- | -------- | ----------------------------------------------- |
| 用 Inferno class 组件 / `createElement` 读 core `signal` / `computed` | 适合     | `SignalValue` 在挂载时建立订阅并驱动 computed   |
| 用 atom / store / proxy 或新增三种范式                                | 适合     | 各子入口提供对应 render-prop 组件               |
| SSR 首屏 + hydration                                                  | 适合     | SSR 读 Scope 覆盖值，hydration 复用 DOM         |
| 需要函数组件 / hooks 写法                                             | 不适合   | 本包以 class 组件暴露，源码不使用 Inferno hooks |
| 需要绑定替你写入状态                                                  | 不适合   | 只读，写入走 `set` / `dispatch` / `send`        |

## 安装

```sh
pnpm add @slux/core @slux/inferno inferno
```

- **必需 peer**：`@slux/core`（`workspace:^`）、`inferno@^10.0.0`。
- **可选 peer（范式包）**：`@slux/atom`、`@slux/store`、`@slux/proxy`、`@slux/flux`、`@slux/state-machine`、`@slux/rxjs` 均为 `optional`，**只装实际使用的子入口**。
- `@slux/shared` 是本包运行时依赖，安装时自动带入。
- 主入口与每个子入口都通过 `exports` 同时提供 ESM（`import`）、CJS（`require`）与 `.d.ts` / `.d.cts` 类型声明。
- 本包**不依赖** `inferno-create-element`；下例用它创建 VNode，也可改用项目自身的 Inferno JSX 编译配置。

`package.json` 的 `exports` 子入口（逐个列出）：

| 📦 子路径                     | 导出内容                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `@slux/inferno`               | 主入口：`SignalValue`、`ScopeProvider`、`getScope`、`createAutoImportApis` 及三个类型 |
| `@slux/inferno/atom`          | `AtomValue`、`setAtom`、`AtomValueProps`                                              |
| `@slux/inferno/store`         | `StoreValue`、`StoreValueProps`                                                       |
| `@slux/inferno/proxy`         | `ProxyValue`、`ProxyValueProps`                                                       |
| `@slux/inferno/flux`          | `FluxValue`、`FluxValueProps`                                                         |
| `@slux/inferno/state-machine` | `MachineValue`、`MachineValueProps`                                                   |
| `@slux/inferno/rxjs`          | `ObservableValue`、`ObservableValueProps`                                             |
| `@slux/inferno/package.json`  | 包元数据（非 API）                                                                    |

## 快速开始

```ts
import { createElement as h } from "inferno-create-element";
import { signal } from "@slux/core";
import { SignalValue } from "@slux/inferno";

const count = signal(0);

const view = h(SignalValue<number>, {
  source: count,
  children: (value) => h("span", null, String(value)),
});
```

🚀 `SignalValue` 的 `source` 是 `Subscribable<T>`，`children` 是 render prop；`count.set(...)` 写入后组件重新渲染并输出新值。

## 主入口 API

🧭 主入口导出 `ScopeProvider`、`getScope`、`SignalValue`、`createAutoImportApis`，以及类型 `ScopeContext`、`ScopeProviderProps`、`SignalValueProps`。

| 🧭 成员                | 签名                                                                                                       | 行为                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `ScopeProvider`        | `class extends Component<ScopeProviderProps>`                                                              | 通过 Inferno `getChildContext()` 提供 `{ sluxScope: scope }`；`render()` 返回 `children` |
| `getScope`             | `(context: ScopeContext) => Scope \| undefined`                                                            | 从 legacy context 读 `sluxScope`；class 组件用 `getScope(this.context as ScopeContext)`  |
| `SignalValue`          | `class SignalValue<T, Props extends SignalValueProps<T> = SignalValueProps<T>> extends Observer<Props, T>` | `source` 为 `Subscribable<T>`；`children` render prop 输出 `T`                           |
| `createAutoImportApis` | `(prefix?: string) => ImportsMap`                                                                          | 生成 `unplugin-auto-import` 配置，见「自动导入」                                         |

`SignalValue` 的三处关键实现：

| 🧭 环节             | 实现                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------- |
| `read()`            | 未挂载且存在 scope 时 `scope.get(source)`，否则 `source.get()`                         |
| `subscribe(notify)` | `source.subscribe(notify)` + `effect(() => { source.get(); })`，返回同时释放二者的函数 |
| `componentDidMount` | 先置 `#mounted = true`，再调用 `super.componentDidMount()` 建立订阅                    |

内部 `Observer` 基类（`src/observer.ts`，**未从任何入口导出**）统一负责订阅生命周期：`componentDidMount` 建立订阅并立即 check 一次；`componentDidUpdate` 在 `source(prevProps) !== source(props)` 时释放旧订阅、重新连接；`componentWillUnmount` 释放订阅；`render()` 用 `read()` 交给 `view(value)`（即 `children`）；`equal` 默认 `Object.is`，值不等时 `forceUpdate()`。

Scope 与 context 用法：

```ts
import { Component } from "inferno";
import type { InfernoNode } from "inferno";
import { createElement as h } from "inferno-create-element";
import { createScope, signal } from "@slux/core";
import { ScopeProvider, getScope, type ScopeContext } from "@slux/inferno";

const source = signal(1);
const scope = createScope();
scope.set(source, 20);

class Scoped extends Component {
  override render(): InfernoNode {
    return h("span", null, String(getScope(this.context as ScopeContext)?.get(source)));
  }
}

const view = h(ScopeProvider, { scope }, h(Scoped));
```

## 子入口 API

🧭 所有读取组件都是 class 组件，`children` 为 `(value) => InfernoNode`；**不返回写入 tuple，也不创建副本**。

### `@slux/inferno/atom`

`AtomValueProps<T> = { atom: AnyReadableAtom<T>; children: (value: T) => InfernoNode }`。

| 💡 导出     | 签名                                                        | 说明                                         |
| ----------- | ----------------------------------------------------------- | -------------------------------------------- |
| `AtomValue` | `class AtomValue<T> extends Observer<AtomValueProps<T>, T>` | 来源 prop 为 `atom`，支持只读派生 atom       |
| `setAtom`   | `<T>(atom: Atom<T>, value: T) => void`                      | 按替换契约写值；也可直接用业务 atom 的 `set` |

### `@slux/inferno/store`

`StoreValueProps<State, Selection = State>` 含 `store: StoreApi<State>`、`children: (value: Selection) => InfernoNode`、可选 `equalityFn`，以及 `selector` 的联合约束：提供 selector 得到 `Selection`；不提供时 `Selection` 必须可容纳 `State`（返回完整状态）。

| 💡 导出      | 签名                                                                              | 说明                                                       |
| ------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `StoreValue` | `class StoreValue<State extends object, Selection = State> extends Observer<...>` | 来源 prop 为 `store`；`equal` 用 `equalityFn ?? Object.is` |

```ts
import { createElement as h } from "inferno-create-element";
import { createStore } from "@slux/store";
import { StoreValue } from "@slux/inferno/store";

type State = { count: number };
const store = createStore<State>(() => ({ count: 1 }));

const view = h(StoreValue<State, number>, {
  store,
  selector: (state) => state.count,
  children: (count) => h("span", null, String(count)),
});
```

selector / `equalityFn` 变化不触发重新订阅（`source` 仍是同一 store），但在下一次渲染的 `read()` / `equal()` 中立即生效。写入仍用 `store.setState(...)`。

### `@slux/inferno/proxy`

`ProxyValueProps<T extends object> = { proxy: T; children: (value: Snapshot<T>) => InfernoNode }`。

| 💡 导出      | 签名                                                                                   | 说明                                                           |
| ------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `ProxyValue` | `class ProxyValue<T extends object> extends Observer<ProxyValueProps<T>, Snapshot<T>>` | 来源 prop 为 `proxy`；返回整个对象的深只读快照，无字段访问追踪 |

### 新增三种范式（只读）

三个组件都 `extends SignalValue`，统一使用 `source` prop，`children` 均为 `(value) => InfernoNode`。

| 子路径                        | 组件与 props                                                                                            | children 值类型                   | 写入方式                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------ |
| `@slux/inferno/flux`          | `FluxValue<State, Action extends { type: string }>`、`FluxValueProps<State, Action>`                    | `State`                           | `store.dispatch(action)` |
| `@slux/inferno/state-machine` | `MachineValue<Context, Event extends { type: string }, State extends string>`、`MachineValueProps<...>` | `MachineSnapshot<Context, State>` | `machine.send(event)`    |
| `@slux/inferno/rxjs`          | `ObservableValue<T>`、`ObservableValueProps<T>`                                                         | `T`                               | 桥接创建者持有上游       |

## 专属语义与边界

- **SSR / hydration**：`renderToString` 不触发 `componentDidMount`，因此**不建立订阅、不启动 core `effect`**；`SignalValue.read()` 在未挂载时读 `scope.get(source)` 覆盖值，无 scope 则读全局值。hydration 复用 DOM 后 `componentDidMount` 置 `#mounted = true` 并切到全局来源读取。Inferno 在生命周期中排队的更新会在**微任务**提交，因此挂载后需等待一个微任务才读到全局值。
- **Scope 边界**：`ScopeProvider` 用 Inferno 原生 legacy context（`getChildContext()`）传递 `{ sluxScope }`，class 组件用 `getScope(this.context as ScopeContext)` 显式读取。只有 `SignalValue` 在服务端 / 首次挂载前应用 scope 覆盖值；`AtomValue` / `StoreValue` / `ProxyValue` 及三个新增范式组件读取各自实例，**不应用 core scope**。`scope.set()` 不触发全局订阅（通用约定见仓库根 README）。
- **订阅与清理**：`Observer` 在挂载时 `subscribe(check)` 并立即 check；`componentDidUpdate` 比较 `source(prevProps)` 与 `source(props)`，来源切换时释放旧订阅并重建；`componentWillUnmount` 释放订阅。`SignalValue`、`AtomValue` 的订阅内额外建立 core `effect` 驱动惰性 computed；`StoreValue` / `ProxyValue` 直接订阅各自 store / proxy。组件卸载**不销毁**业务 store / flux / machine / observable，桥接创建者负责 `dispose()`。
- **快照相等判定**：`Observer.equal` 默认 `Object.is`，值相等时跳过 `forceUpdate()`；`StoreValue` 用 `equalityFn ?? Object.is`。`@slux/proxy` 的 `snapshot` 为冻结、结构共享的深只读快照，未变分支保持引用。
- **错误处理**：绑定层不新增错误包装；写入、通知与 `effect` 的错误行为遵循 `@slux/core`。RxJS 桥接的完成 / 错误状态由 `@slux/rxjs` 的 `status` / `error` 只读信号读取。
- **通用约定**：跨框架的写入形式、Scope、SSR 与桥接生命周期约定见 [仓库根 README](../../README.md) 的「框架适配 · 通用约定」；仓库内验证命令见「本地开发」，本文不重复。

## 自动导入

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/inferno";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

🔌 `createAutoImportApis(prefix = "")` 的登记清单以 `src/auto-import-api.ts` 的 `allImportApis` 为准，当前为 **`ScopeProvider`、`SignalValue`、`getScope`** 三项，来源名 `@slux/inferno`。传入前缀可生成别名，大写规则由 `@slux/shared` 的 `generateBatchAutoImports` 决定。清单**只含主入口运行时导出**，不含 `createAutoImportApis` 自身、三个类型，也不含任何子入口组件。

## 类型导出

| 类型                                       | 导出位置                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `ScopeContext`                             | 主入口：`{ sluxScope?: Scope }`                                            |
| `ScopeProviderProps`                       | 主入口：`{ scope: Scope; children?: InfernoNode }`                         |
| `SignalValueProps<T>`                      | 主入口：`{ source: Subscribable<T>; children: (value: T) => InfernoNode }` |
| `AtomValueProps<T>`                        | `/atom`                                                                    |
| `StoreValueProps<State, Selection>`        | `/store`                                                                   |
| `ProxyValueProps<T>`                       | `/proxy`                                                                   |
| `FluxValueProps<State, Action>`            | `/flux`                                                                    |
| `MachineValueProps<Context, Event, State>` | `/state-machine`                                                           |
| `ObservableValueProps<T>`                  | `/rxjs`                                                                    |

💡 `Scope` / `Subscribable<T>` 来自 `@slux/core`，`InfernoNode` 来自 `inferno`，`AnyReadableAtom` / `Atom`、`StoreApi`、`Snapshot`、`FluxStore`、`MachineSnapshot` / `StateMachine`、`ObservableState` 等从各自范式包导入。`Observer` 基类未从任何入口导出，不属于公开类型。

## 不适用的场景

- 需要函数组件 / hooks 写法：本包以 class 组件与 render prop 暴露。
- 需要绑定返回写入 tuple、selector 之外的写入接口或状态副本：只读原实例。
- 需要在同一组件实例内切换来源后仍保持旧来源订阅：`Observer` 在来源切换时会释放旧订阅；如需并存请渲染多个组件。
- 需要自动的请求级状态隔离或自动序列化 / 恢复：见仓库根 README 的通用约定，需调用方按请求建实例。

## 版本、许可与反馈

- 版本：`0.2.4`（`package.json`）；许可：[MIT](../../LICENSE) © itmanyong。
- 问题反馈：[GitHub Issues](https://github.com/itmanyong/slux/issues)。
- 通用约定与本地开发命令见 [仓库根 README](../../README.md)。

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
