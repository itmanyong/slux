# @slux/solid

把 `@slux/core` 的响应式状态接入 Solid 1.9 的细粒度响应式系统。核心绑定 `useSignal` 返回 Solid 原生 `Accessor<T>`（内部由 `createSignal` 提供），在 JSX 或响应式计算里调用 `value()` 读取；主入口另提供 core `Scope` 的 Context 封装与 `createAutoImportApis`。六个范式各通过独立子入口提供同样返回 `Accessor` 的绑定。

跨框架一致的子入口划分、Flux / 状态机 / RxJS 的写入与桥接生命周期、Scope 显式覆盖语义与 SSR 通用约束见仓库根 [README](../../README.md) 的「框架适配 · 通用约定」；仓库内构建与验证命令见「本地开发」，本文不再重复。

## 特性与适用场景

| 场景                                                                   | 是否适合 | 说明                                                                |
| ---------------------------------------------------------------------- | -------- | ------------------------------------------------------------------- |
| 在 Solid 1.9 组件或 `createRoot` 里把 signal、computed 读成 `Accessor` | 适合     | `useSignal` 返回 `Accessor<T>`，值变化写入 Solid signal，细粒度更新 |
| 在 JSX / `createComputed` / `createMemo` 中持续追踪                    | 适合     | 调用 accessor 即建立追踪，订阅随 owner 清理                         |
| 消费 atom、store、proxy、flux、state-machine、rxjs 六种范式            | 适合     | 六个 `/xxx` 子入口分别导出对应绑定                                  |
| 在组件或 `createRoot` 之外调用，或期望自动套用 Scope 覆盖              | 不适合   | `getOwner()` 为假时抛错；`useSignal` 始终读全局来源                 |

## 安装

```sh
pnpm add @slux/solid @slux/core solid-js
```

| 项         | 值                                                                                                                                    | 来源                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Solid peer | `^1.9.0`（`solid-js`）                                                                                                                | `package.json` `peerDependencies` |
| 必需 peer  | `@slux/core`（`workspace:^`）                                                                                                         | 同上                              |
| 可选 peer  | `@slux/atom`、`@slux/store`、`@slux/proxy`、`@slux/flux`、`@slux/state-machine`、`@slux/rxjs`（均 `workspace:^` 且 `optional: true`） | `peerDependenciesMeta`            |
| 运行时依赖 | `@slux/shared`（随包安装）                                                                                                            | `dependencies`                    |

范式包是**可选 peer，只安装实际使用的**：用哪个子入口就装哪个包；`@slux/core` 是全部入口的必需依赖。客户端构建需启用 Solid 的 `browser` 导出条件，Node 默认加载服务端运行时。

`package.json` 的 `exports` 子入口（每个都提供 ESM `import` 与 CJS `require`，并带 `.d.ts` / `.d.cts`）：

| 子入口                      | 说明                                                                   |
| --------------------------- | ---------------------------------------------------------------------- |
| `@slux/solid`               | 主入口：`useSignal`、`useStore`、Scope Context、`createAutoImportApis` |
| `@slux/solid/atom`          | atom 绑定                                                              |
| `@slux/solid/store`         | store 绑定                                                             |
| `@slux/solid/proxy`         | proxy 绑定                                                             |
| `@slux/solid/flux`          | flux 绑定                                                              |
| `@slux/solid/state-machine` | 状态机绑定                                                             |
| `@slux/solid/rxjs`          | RxJS 桥接绑定                                                          |
| `@slux/solid/package.json`  | 包元信息                                                               |

> 源码事实：主入口 `src/index.ts` 额外 `export { useStore } from "./store.js"`，与 `/store` 子入口是同一实现；`store.ts` 只 `import type { StoreApi }`，不引入 `@slux/store` 运行时依赖。

## 快速开始

```tsx
import { signal } from "@slux/core";
import { useSignal } from "@slux/solid";

const count = signal(0);
function Counter() {
  const value = useSignal(count); // Accessor<number>
  return <button onClick={() => count.set((n) => n + 1)}>{value()}</button>;
}
```

`useSignal` 只负责读取与订阅，写入用 core 的 `set`。accessor 在 JSX 或响应式计算里调用才持续追踪；它不接受 setter 参数（只读）。

## 主入口 API

### `useSignal`

```ts
function useSignal<T>(source: Subscribable<T>): Accessor<T>;
```

| 行为           | 说明                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 返回形式       | `createSignal(source.get())` 的读取端 `Accessor<T>`；`Accessor` 来自 `solid-js`                                                      |
| 调用位置       | 必须在组件或 `createRoot` 中；`getOwner()` 为假时抛 `Error("useSignal 必须在 Solid 组件或 createRoot 中调用")`                       |
| 服务端         | `isServer`（`solid-js/web`）为真时直接返回初值 accessor，**不订阅、不建 core effect**                                                |
| 客户端订阅     | `source.subscribe((next) => setValue(() => next))` 把变化送入 Solid signal；另起 core `effect(() => source.get())` 刷新惰性 computed |
| 补读           | 建立订阅后 `setValue(() => source.get())`，对齐首次通知期间的写入                                                                    |
| 清理           | `onCleanup(() => { unsubscribe(); dispose(); })`，随 owner（组件卸载或 `createRoot` 的 `dispose`）执行                               |
| 函数值         | `setValue(() => next)` 用 thunk 写入，函数值按原引用保存，不被执行                                                                   |
| **不读 Scope** | 源码未引用 `useScope()`，始终读全局 `source.get()` / `subscribe`；覆盖需显式 `useScope()?.get(source)`                               |

自定义来源只需满足 `Subscribable<T>`（`get()` + `subscribe(cb)`，后者返回取消函数）。

### Scope Context

| 导出                 | 签名 / 类型                                                 | 说明                                                                              |
| -------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `ScopeContext`       | `Context<Scope>`（`createContext` 产出，默认 `undefined`）  | 可配合 `useContext` 读取                                                          |
| `ScopeProvider`      | `(props: ScopeProviderProps) => JSX.Element`                | 调用 `ScopeContext.Provider`，`value` 取 `props.scope`，`children` 用 getter 传入 |
| `useScope`           | `() => Scope \| undefined`                                  | `useContext(ScopeContext)`，无提供者时 `undefined`                                |
| `ScopeProviderProps` | `{ readonly scope: Scope; readonly children: JSX.Element }` | Provider 属性类型（公开类型导出）                                                 |

Provider 在初始化时读取 `props.scope`，替换 Scope 需重新创建子树；读取 `useScope()` 不改变全局信号语义。

## 子入口 API

六个子入口的绑定**全部委托 `useSignal`**（atom 的 `useAtomValue` 直接 `useSignal(atom)`，store / proxy 构造 `{ get, subscribe }` 再传入，flux / 状态机 / rxjs 直接 `useSignal(原实例)`），统一返回 `Accessor<...>`，并继承主入口的 owner 约束、服务端不订阅、订阅清理与 Scope 边界。写入仍走原实例，绑定不返回写入 tuple 或 selector。

| 子入口           | 导出                                    | 签名要点                                                                   | 返回值                                                       | 写入方式                            |
| ---------------- | --------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------- |
| `/atom`          | `useAtomValue`、`useSetAtom`、`useAtom` | `<T>(atom)`                                                                | `Accessor<T>`、`(value: T) => void`、`[Accessor<T>, setter]` | `set(value)` 或 `atom.update(fn)`   |
| `/store`         | `useStore`                              | `(store, selector?, equals?)`                                              | `Accessor<T \| U>`                                           | `store.setState(...)`               |
| `/proxy`         | `useSnapshot`                           | `<T extends object>(proxy: T)`                                             | `Accessor<Snapshot<T>>`                                      | 直接修改原 proxy                    |
| `/flux`          | `useFluxStore`                          | `<State, Action extends FluxAction>(store)`                                | `Accessor<State>`                                            | `store.dispatch(action)`            |
| `/state-machine` | `useMachine`                            | `<Context, Event extends { type: string }, State extends string>(machine)` | `Accessor<MachineSnapshot<Context, State>>`                  | `machine.send(event)`               |
| `/rxjs`          | `useObservable`                         | `<T>(source: ObservableState<T>)`                                          | `Accessor<T>`                                                | 上游 Observable，创建者 `dispose()` |

### `/atom`

```tsx
import { atom, derived } from "@slux/atom";
import { useAtom, useAtomValue } from "@slux/solid/atom";

const count = atom(0);
const doubled = derived((get) => get(count) * 2);
function Counter() {
  const [value, set] = useAtom(count); // [Accessor<number>, (v: number) => void]
  const double = useAtomValue(doubled); // Accessor<number>
  return <button onClick={() => set(value() + 1)}>{double()}</button>;
}
```

`useAtomValue` 可读基础、派生与 writable atom（`AnyReadableAtom<T>`）；`useSetAtom` 返回 `(value) => atom.set(value)`，**只做替换、不订阅**；`useAtom` 组合前两者。派生 atom 不可传给 `useSetAtom`（类型上被禁止）。

### `/store`

```tsx
import { createStore } from "@slux/store";
import { useStore } from "@slux/solid/store";

const store = createStore(() => ({ count: 0, other: 0 }));
function Counter() {
  const count = useStore(store, (state) => state.count); // Accessor<number>
  const whole = useStore(store); // Accessor<{ count: number; other: number }>
  return <span>{count()}</span>;
}
```

`useStore(store)` 返回完整状态；带 `selector, equals?` 时返回选值，`equals` 默认 `Object.is`，判定相等时保留上次选值引用。快照读 `store.getState()` 当前值；owner 清理只退订，不销毁 store。

### `/proxy`

```tsx
import { observable } from "@slux/proxy";
import { useSnapshot } from "@slux/solid/proxy";

const state = observable({ user: { name: "Alice" } });
const snap = useSnapshot(state); // Accessor<Snapshot<...>>
```

`useSnapshot` 用 `@slux/proxy` 的 `snapshot` / `subscribe` 桥接；嵌套与深层变更都会发布新快照，快照深层只读，修改走原 proxy，订阅不按组件读取的属性筛选。

### `/flux`、`/state-machine`、`/rxjs`

```tsx
import { createFluxStore } from "@slux/flux";
import { fromObservable } from "@slux/rxjs";
import { Subject } from "rxjs";
import { useFluxStore } from "@slux/solid/flux";
import { useObservable } from "@slux/solid/rxjs";

const flux = createFluxStore((state: number, action: { type: "add"; amount: number }) => state + action.amount, 0);
const observable = fromObservable(new Subject<number>(), 0);
// 组件内：
const fluxValue = useFluxStore(flux); // Accessor<number>
const observableValue = useObservable(observable); // Accessor<number>
// useMachine(machine) → Accessor<MachineSnapshot<Context, State>>，含 value / context，写入 machine.send(event)
```

`useObservable` 只接收 `fromObservable(source, initialValue)` 产出的 `ObservableState<T>`，不接受原始 RxJS `Observable`；完成与错误读 `source.status` / `source.error`。owner 清理只解除自身绑定，桥接 `dispose()` 由创建者负责。

## 专属语义与边界

### SSR 与 hydration

- 服务端导出条件（`isServer === true`）下，`useSignal` 在 `createSignal(source.get())` 后直接返回，**不建立 `subscribe`、不留 core effect**；SSR 输出全局初值。
- 该初值不是 Scope 覆盖值：`useSignal` 不读取 `useScope()`。需要请求级覆盖时显式 `useScope()?.get(source)`，并为客户端准备相同的初始数据。
- 全部子入口经 `useSignal` 桥接，SSR 行为一致：读各自来源当前值、不创建消费订阅。客户端构建需启用 Solid 的 `browser` 导出条件，Node 默认加载服务端运行时。

### 订阅与清理

- 订阅与 core `effect` 由 `onCleanup` 随 owner 释放：组件卸载或 `createRoot` 的 `dispose()` 同时执行 `unsubscribe()` 与 `dispose()`，不销毁原状态实例。
- 只有在 JSX 或 Solid 响应式计算（`createComputed` / `createEffect` / `createMemo` 等）里调用 accessor 才建立持续追踪；单纯保存 accessor 不订阅。`setValue(() => next)` 以 thunk 写入，函数值按原引用保存，`Object.is` 相等的值不让下游重算。
- 绑定不捕获异常：`source.get()` 抛错会在初始化或 `effect` 求值时向上传播，订阅与 `effect` 错误沿用 `@slux/core` 的同步执行与错误汇总语义。

### Scope 显式覆盖契约

`scope.set()` 不触发全局订阅，`runInScope()` 不改写全局 signal 读写，computed 不会在 Scope 内自动重算；这些沿用 core 契约，见根 README 通用约定。本包 Context 只负责传递 Scope，绑定本身不自动应用覆盖值。

## 自动导入

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/solid";

export default { plugins: [AutoImport({ imports: [createAutoImportApis()] })] };
```

`createAutoImportApis(prefix?)` 返回 `unplugin-auto-import` 的 `ImportsMap`，来源名 `@slux/solid`。`src/auto-import-api.ts` 当前登记：`ScopeContext`、`ScopeProvider`、`useScope`、`useSignal`、`useStore`（仅主入口 API，**不含** `createAutoImportApis` 自身与各子入口绑定）。传入前缀时按 `@slux/shared` 的 `createAutoImports` 规则生成别名。

## 类型导出

主入口只导出一个类型：`ScopeProviderProps`（`src/scope.ts`）=`{ readonly scope: Scope; readonly children: JSX.Element }`。六个子入口只导出运行时函数，不额外导出类型。`Accessor` 来自 `solid-js`，`Subscribable` / `Scope` 来自 `@slux/core`，`Snapshot` 来自 `@slux/proxy`，`FluxStore` / `MachineSnapshot` / `ObservableState` 来自各自范式包，均按包名从原包导入。

## 不适用的场景

- 在组件或 `createRoot` 之外调用读取函数：会抛错，需在响应式 owner 内调用。
- 期望绑定自动套用 Scope 覆盖值、把覆盖写回全局，或 SSR 自动序列化 / 恢复请求状态：绑定只读全局来源，需调用方自行准备客户端初始数据与 Scope，见根 README 通用约定。
- 需要脱离 Solid owner 的长期订阅：直接用 `@slux/core` 的 `effect`。

## 版本、许可与反馈

- 版本：`0.1.0`（`package.json`）。
- 许可：[MIT](../../LICENSE) © itmanyong。
- 仓库：`github.com/itmanyong/slux`（`packages/solid`）。
- 问题反馈：`https://github.com/itmanyong/slux/issues`。
