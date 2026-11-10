# @slux/inferno

Inferno 10（`inferno@^10.0.0`）的 slux 绑定，基于 `@slux/core` 的 `Subscribable<T>` 订阅模型。原生绑定形式是 **原生 class 组件生命周期管理订阅 + render prop 输出值**：所有读取组件都接受 `children: (value) => InfernoNode`，由内部 `Observer` 基类在挂载、更新、卸载时管理订阅。所有写入仍走原实例，绑定只读。

## 特性与适用场景

| 项       | 说明                                                                                   |
| -------- | -------------------------------------------------------------------------------------- |
| 绑定形式 | class 组件 + `children: (value) => InfernoNode` render prop                            |
| 框架依赖 | `inferno` 的 `Component` / `InfernoNode`，以及原生 legacy context（`getChildContext`） |
| 范式覆盖 | core 主入口 + atom / store / proxy / flux / state-machine / rxjs 六个子入口            |
| SSR      | `renderToString` 不挂载、不订阅；`ScopeProvider` 提供覆盖首屏值，支持 hydration        |

| 场景                                                                  | 是否适合 | 说明                                            |
| --------------------------------------------------------------------- | -------- | ----------------------------------------------- |
| 用 Inferno class 组件 / `createElement` 读 core `signal` / `computed` | 适合     | `SignalValue` 在挂载时建立订阅并驱动 computed   |
| 用 atom / store / proxy 或新增三种范式                                | 适合     | 各子入口提供对应 render-prop 组件               |
| SSR 首屏 + hydration                                                  | 适合     | SSR 读 Scope 覆盖值，hydration 复用 DOM         |
| 需要函数组件 / hooks 写法                                             | 不适合   | 本包以 class 组件暴露，源码不使用 Inferno hooks |
| 需要绑定替你写入状态                                                  | 不适合   | 只读，写入走 `set` / `dispatch` / `send`        |

## 安装

```sh
pnpm add @slux/core @slux/inferno inferno@^10
```

- **必需 peer**：`@slux/core`（`workspace:^`）、`inferno@^10.0.0`。
- **可选 peer（范式包）**：`@slux/atom`、`@slux/store`、`@slux/proxy`、`@slux/flux`、`@slux/state-machine`、`@slux/rxjs` 均为 `optional`，**只装实际使用的子入口**。
- `@slux/shared` 是本包运行时依赖，安装时自动带入。
- 主入口与每个子入口都通过 `exports` 同时提供 ESM（`import`）、CJS（`require`）与 `.d.ts` / `.d.cts` 类型声明。
- 本包**不依赖** `inferno-create-element`；下例用它创建 VNode，也可改用项目自身的 Inferno JSX 编译配置。

`package.json` 的 `exports` 子入口（逐个列出）：

| 子路径                        | 导出内容                                                                              |
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

`SignalValue` 的 `source` 是 `Subscribable<T>`，`children` 是 render prop；`count.set(...)` 写入后组件重新渲染并输出新值。

## 主入口 API

主入口导出 `ScopeProvider`、`getScope`、`SignalValue`、`createAutoImportApis`，以及类型 `ScopeContext`、`ScopeProviderProps`、`SignalValueProps`。

| 成员                   | 签名                                                                                                       | 行为                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `ScopeProvider`        | `class extends Component<ScopeProviderProps>`                                                              | 通过 Inferno `getChildContext()` 提供 `{ sluxScope: scope }`；`render()` 返回 `children` |
| `getScope`             | `(context: ScopeContext) => Scope \| undefined`                                                            | 从 legacy context 读 `sluxScope`；class 组件用 `getScope(this.context as ScopeContext)`  |
| `SignalValue`          | `class SignalValue<T, Props extends SignalValueProps<T> = SignalValueProps<T>> extends Observer<Props, T>` | `source` 为 `Subscribable<T>`；`children` render prop 输出 `T`                           |
| `createAutoImportApis` | `(prefix?: string) => ImportsMap`                                                                          | 生成 `unplugin-auto-import` 配置，见「自动导入」                                         |

`SignalValue` 的三处关键实现：

| 环节                | 实现                                                                                   |
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

所有读取组件都是 class 组件，`children` 为 `(value) => InfernoNode`；**不返回写入 tuple，也不创建副本**。

### `@slux/inferno/atom`

`AtomValueProps<T> = { atom: AnyReadableAtom<T>; children: (value: T) => InfernoNode }`。

| 导出        | 签名                                                        | 说明                                         |
| ----------- | ----------------------------------------------------------- | -------------------------------------------- |
| `AtomValue` | `class AtomValue<T> extends Observer<AtomValueProps<T>, T>` | 来源 prop 为 `atom`，支持只读派生 atom       |
| `setAtom`   | `<T>(atom: Atom<T>, value: T) => void`                      | 按替换契约写值；也可直接用业务 atom 的 `set` |

### `@slux/inferno/store`

`StoreValueProps<State, Selection = State>` 含 `store: StoreApi<State>`、`children: (value: Selection) => InfernoNode`、可选 `equalityFn`，以及 `selector` 的联合约束：提供 selector 得到 `Selection`；不提供时 `Selection` 必须可容纳 `State`（返回完整状态）。

| 导出         | 签名                                                                              | 说明                                                       |
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

| 导出         | 签名                                                                                   | 说明                                                           |
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

`createAutoImportApis(prefix = "")` 的登记清单以 `src/auto-import-api.ts` 的 `allImportApis` 为准，当前为 **`ScopeProvider`、`SignalValue`、`getScope`** 三项，来源名 `@slux/inferno`。传入前缀可生成别名，大写规则由 `@slux/shared` 的 `generateBatchAutoImports` 决定。清单**只含主入口运行时导出**，不含 `createAutoImportApis` 自身、三个类型，也不含任何子入口组件。

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

`Scope` / `Subscribable<T>` 来自 `@slux/core`，`InfernoNode` 来自 `inferno`，`AnyReadableAtom` / `Atom`、`StoreApi`、`Snapshot`、`FluxStore`、`MachineSnapshot` / `StateMachine`、`ObservableState` 等从各自范式包导入。`Observer` 基类未从任何入口导出，不属于公开类型。

## 不适用的场景

- 需要函数组件 / hooks 写法：本包以 class 组件与 render prop 暴露。
- 需要绑定返回写入 tuple、selector 之外的写入接口或状态副本：只读原实例。
- 需要在同一组件实例内切换来源后仍保持旧来源订阅：`Observer` 在来源切换时会释放旧订阅；如需并存请渲染多个组件。
- 需要自动的请求级状态隔离或自动序列化 / 恢复：见仓库根 README 的通用约定，需调用方按请求建实例。

## 版本、许可与反馈

- 版本：`0.1.0`（`package.json`）；许可：[MIT](../../LICENSE) © itmanyong。
- 问题反馈：`https://github.com/itmanyong/slux/issues`。
- 通用约定与本地开发命令见 [仓库根 README](../../README.md)。
