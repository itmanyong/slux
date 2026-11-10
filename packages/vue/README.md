# @slux/vue

把 `@slux/core` 的响应式状态接入 Vue 3.5 组合式 API。核心绑定 `useSignal` 返回一个**只读 Ref**（`Readonly<Ref<T>>`，内部为 `shallowRef` + `shallowReadonly`），在模板里可自动解包；主入口另提供 core `Scope` 的 provide / inject 封装与 `createAutoImportApis`。六个范式各通过独立子入口提供同样返回只读 Ref 的绑定。

跨框架一致的子入口划分、Flux / 状态机 / RxJS 的写入与桥接生命周期、Scope 显式覆盖语义与 SSR 通用约束见仓库根 [README](../../README.md) 的「框架适配 · 通用约定」；仓库内构建与验证命令见「本地开发」，本文不再重复。

## 特性与适用场景

| 场景                                                               | 是否适合 | 说明                                                              |
| ------------------------------------------------------------------ | -------- | ----------------------------------------------------------------- |
| 在 `setup()` / `<script setup>` 里把 signal、computed 读成只读 Ref | 适合     | `useSignal` 返回 `Readonly<Ref<T>>`，值变化写入 ref，模板自动解包 |
| 在独立 `effectScope` 中桥接状态并手动 `stop()`                     | 适合     | 无组件实例时立即订阅，`scope.stop()` 触发清理                     |
| 消费 atom、store、proxy、flux、state-machine、rxjs 六种范式        | 适合     | 六个 `/xxx` 子入口分别导出对应绑定                                |
| 组件外 / 异步回调里调用读取函数，或期望自动套用 Scope 覆盖         | 不适合   | `useSignal` 必须在 setup / effectScope 中，且始终读全局来源       |

## 安装

```sh
pnpm add @slux/vue @slux/core vue
```

| 项         | 值                                                                                                                                    | 来源                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Vue peer   | `^3.5.0`                                                                                                                              | `package.json` `peerDependencies` |
| 必需 peer  | `@slux/core`（`workspace:^`）                                                                                                         | 同上                              |
| 可选 peer  | `@slux/atom`、`@slux/store`、`@slux/proxy`、`@slux/flux`、`@slux/state-machine`、`@slux/rxjs`（均 `workspace:^` 且 `optional: true`） | `peerDependenciesMeta`            |
| 运行时依赖 | `@slux/shared`（随包安装）                                                                                                            | `dependencies`                    |

范式包是**可选 peer，只安装实际使用的**：用哪个子入口就装哪个包；`@slux/core` 是全部入口的必需依赖。SSR 用到的 `@vue/server-renderer` 由应用自行提供。

`package.json` 的 `exports` 子入口（每个都提供 ESM `import` 与 CJS `require`，并带 `.d.ts` / `.d.cts`）：

| 子入口                    | 说明                                                                |
| ------------------------- | ------------------------------------------------------------------- |
| `@slux/vue`               | 主入口：`useSignal`、`useStore`、Scope 封装、`createAutoImportApis` |
| `@slux/vue/atom`          | atom 绑定                                                           |
| `@slux/vue/store`         | store 绑定                                                          |
| `@slux/vue/proxy`         | proxy 绑定                                                          |
| `@slux/vue/flux`          | flux 绑定                                                           |
| `@slux/vue/state-machine` | 状态机绑定                                                          |
| `@slux/vue/rxjs`          | RxJS 桥接绑定                                                       |
| `@slux/vue/package.json`  | 包元信息                                                            |

> 源码事实：主入口 `src/index.ts` 额外 `export { useStore } from "./store.js"`，与 `/store` 子入口是同一实现；`store.ts` 只 `import type { StoreApi }`，不引入 `@slux/store` 运行时依赖。

## 快速开始

```vue
<script setup lang="ts">
import { signal } from "@slux/core";
import { useSignal } from "@slux/vue";

const count = signal(0);
const value = useSignal(count); // Readonly<Ref<number>>
function increment() {
  count.set((n) => n + 1);
}
</script>

<template>
  <button @click="increment">{{ value }}</button>
</template>
```

`useSignal` 只负责读取与订阅，写入用 core 的 `set`；返回的 ref 是**只读**的，不能 `value.value = ...`。

## 主入口 API

### `useSignal`

```ts
function useSignal<T>(source: Subscribable<T>): Readonly<Ref<T>>;
```

| 行为             | 说明                                                                                                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 返回形式         | `shallowReadonly(shallowRef(source.get()))`，浅层响应式、只读；`Ref` 来自 `vue`                                                                                         |
| 调用位置         | 必须在 `setup()` 或 `effectScope` 中；`getCurrentScope()` 为假时抛 `Error("useSignal 必须在 Vue setup 或 effectScope 中调用")`                                          |
| 组件内启动       | `getCurrentInstance()` 为真时用 `onMounted` 启动订阅；SSR 不执行挂载钩子，只返回初始读取值、不留订阅                                                                    |
| 独立 effectScope | 无组件实例时立即 `start()` 订阅，由调用方 `scope.stop()` 清理                                                                                                           |
| `start()`        | 订阅 `source.subscribe`（写入 `value.value`）、起 core `effect(() => source.get())` 刷新惰性 computed、补读 `value.value = source.get()`；清理函数同时退订与释放 effect |
| 清理             | `onScopeDispose(() => stop?.())`，组件卸载或 effectScope 停止时执行                                                                                                     |
| 函数值           | 用 `shallowRef` 保存，函数值按原引用返回，不被解包或执行                                                                                                                |
| **不读 Scope**   | 源码未引用 `useScope()`，客户端与 SSR 都是全局 `source.get()` / `subscribe`；覆盖需显式 `useScope()?.get(source)`                                                       |

自定义来源只需满足 `Subscribable<T>`（`get()` + `subscribe(cb)`，后者返回取消函数）。

### Scope 封装

| 导出                | 签名 / 类型                         | 说明                                                                                           |
| ------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `provideScope`      | `(scope: Scope) => void`            | 在 setup 中 `provide` 当前 Scope                                                               |
| `useScope`          | `() => Scope \| undefined`          | `inject` 最近的 Scope，无提供者时 `undefined`                                                  |
| `ScopeProvider`     | `defineComponent`                   | `props.scope` 必填（`Object as PropType<Scope>`），`setup` 内调用 `provideScope`，渲染默认插槽 |
| `sluxPlugin`        | `Plugin<[SluxPluginOptions] \| []>` | `app.use(sluxPlugin, { scope })` 在应用级 `app.provide` Scope                                  |
| `SluxPluginOptions` | `{ readonly scope?: Scope }`        | 插件选项类型（公开类型导出）                                                                   |

`SCOPE_KEY` 是模块内私有的 `InjectionKey<Scope>`，**不导出**。嵌套 Provider 取最近一层（内层覆盖外层）；替换 Scope 需重新创建组件子树。用法见「快速开始」与根 README 的 SSR 通用约定。

## 子入口 API

六个子入口的绑定**全部委托 `useSignal`**（atom 的 `useAtomValue` 直接 `useSignal(atom)`，store / proxy 构造 `{ get, subscribe }` 再传入，flux / 状态机 / rxjs 直接 `useSignal(原实例)`），统一返回 `Readonly<Ref<...>>`，并继承主入口的 setup / effectScope 约束、订阅清理与 SSR 边界。写入仍走原实例，绑定不返回写入 tuple 或 selector。

| 子入口           | 导出                                    | 签名要点                                                                   | 返回值                                                                 | 写入方式                            |
| ---------------- | --------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------- |
| `/atom`          | `useAtomValue`、`useSetAtom`、`useAtom` | `<T>(atom)`                                                                | `Readonly<Ref<T>>`、`(value: T) => void`、`[Readonly<Ref<T>>, setter]` | `set(value)` 或 `atom.update(fn)`   |
| `/store`         | `useStore`                              | `(store, selector?, equals?)`                                              | `Readonly<Ref<T \| U>>`                                                | `store.setState(...)`               |
| `/proxy`         | `useSnapshot`                           | `<T extends object>(proxy: T)`                                             | `Readonly<Ref<Snapshot<T>>>`                                           | 直接修改原 proxy                    |
| `/flux`          | `useFluxStore`                          | `<State, Action extends FluxAction>(store)`                                | `Readonly<Ref<State>>`                                                 | `store.dispatch(action)`            |
| `/state-machine` | `useMachine`                            | `<Context, Event extends { type: string }, State extends string>(machine)` | `Readonly<Ref<MachineSnapshot<Context, State>>>`                       | `machine.send(event)`               |
| `/rxjs`          | `useObservable`                         | `<T>(source: ObservableState<T>)`                                          | `Readonly<Ref<T>>`                                                     | 上游 Observable，创建者 `dispose()` |

### `/atom`

```ts
// 在 setup() 内
import { atom, derived } from "@slux/atom";
import { useAtom, useAtomValue } from "@slux/vue/atom";

const count = atom(0);
const doubled = derived((get) => get(count) * 2);
const [value, set] = useAtom(count); // [Readonly<Ref<number>>, (v: number) => void]
const double = useAtomValue(doubled); // Readonly<Ref<number>>
```

`useAtomValue` 可读基础、派生与 writable atom（`AnyReadableAtom<T>`）；`useSetAtom` 返回 `(value) => atom.set(value)`，**只做替换、不订阅**，函数值直接保存；`useAtom` 组合前两者。派生 atom 不可传给 `useSetAtom`（类型上被禁止）。

### `/store`

```ts
import { createStore } from "@slux/store";
import { useStore } from "@slux/vue/store";

const store = createStore(() => ({ count: 0, other: 0 }));
const count = useStore(store, (state) => state.count); // Readonly<Ref<number>>
const whole = useStore(store); // Readonly<Ref<{ count: number; other: number }>>
```

`useStore(store)` 返回完整状态；带 `selector, equals?` 时返回选值，`equals` 默认 `Object.is`，判定相等时保留上次选值引用，抑制无关字段更新。快照读 `store.getState()` 当前值；组件卸载只退订，不销毁 store。

### `/proxy`

```ts
import { observable } from "@slux/proxy";
import { useSnapshot } from "@slux/vue/proxy";

const state = observable({ user: { name: "Alice" } });
const snap = useSnapshot(state); // Readonly<Ref<Snapshot<...>>>
```

`useSnapshot` 用 `@slux/proxy` 的 `snapshot` / `subscribe` 桥接；嵌套与深层变更都会发布新快照，快照深层只读，修改走原 proxy，订阅不按组件读取的属性筛选。

### `/flux`、`/state-machine`、`/rxjs`

```ts
import { createFluxStore } from "@slux/flux";
import { fromObservable } from "@slux/rxjs";
import { Subject } from "rxjs";
import { useFluxStore } from "@slux/vue/flux";
import { useObservable } from "@slux/vue/rxjs";

const flux = createFluxStore((state: number, action: { type: "add"; amount: number }) => state + action.amount, 0);
const observable = fromObservable(new Subject<number>(), 0);
// setup 内：
const fluxValue = useFluxStore(flux); // Readonly<Ref<number>>
const observableValue = useObservable(observable); // Readonly<Ref<number>>
// useMachine(machine) → Readonly<Ref<MachineSnapshot<Context, State>>>，含 value / context，写入 machine.send(event)
```

`useObservable` 只接收 `fromObservable(source, initialValue)` 产出的 `ObservableState<T>`，不接受原始 RxJS `Observable`；完成与错误读 `source.status` / `source.error`。组件卸载只解除自身绑定，桥接 `dispose()` 由创建者负责。

## 专属语义与边界

### SSR 与 hydration

- Vue SSR（`@vue/server-renderer`）不运行 `onMounted`，`useSignal` 只返回 `shallowRef(source.get())` 的**初始读取值**，不建立 `subscribe`、不留 core `effect`。
- 该初始值是**全局值**，不是 Scope 覆盖值：`useSignal` 不读取 `useScope()`。需要请求级覆盖时显式 `useScope()?.get(source)` 取值，并为客户端准备相同的初始数据。
- 全部子入口经 `useSignal` 桥接，SSR 行为一致：读各自来源当前值（store 用 `getState()`、proxy 用 `snapshot()`）、不创建消费订阅。独立 `effectScope` 不属于 SSR 组件生命周期，调用方需 `stop()`。

### 订阅与清理

- 组件内订阅在 `onMounted` 启动、`onScopeDispose` 在卸载时释放；独立 effectScope 立即启动、由 `scope.stop()` 释放。清理同时退订 `source.subscribe` 与 core `effect`，不销毁原状态实例。
- `shallowReadonly` 只做浅层只读：ref 本身不可赋值，快照对象是否冻结由来源决定。绑定不捕获异常，`source.get()` 抛错会在初始化或 `effect` 求值时向上传播，订阅与 `effect` 错误沿用 `@slux/core` 的同步执行与错误汇总语义。

### Scope 显式覆盖契约

`scope.set()` 不触发全局订阅，`runInScope()` 不改写全局 signal 读写，computed 不会在 Scope 内自动重算；这些沿用 core 契约，见根 README 通用约定。本包 Scope 封装只负责 provide / inject 上下文，绑定本身不自动应用覆盖值。

## 自动导入

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/vue";

export default { plugins: [AutoImport({ imports: [createAutoImportApis()] })] };
```

`createAutoImportApis(prefix?)` 返回 `unplugin-auto-import` 的 `ImportsMap`，来源名 `@slux/vue`。`src/auto-import-api.ts` 当前登记：`ScopeProvider`、`provideScope`、`sluxPlugin`、`useScope`、`useSignal`、`useStore`（仅主入口 API，**不含** `createAutoImportApis` 自身与各子入口绑定）。传入前缀时按 `@slux/shared` 的 `createAutoImports` 规则生成别名。

## 类型导出

主入口只导出一个类型：`SluxPluginOptions`（`src/scope.ts`）=`{ readonly scope?: Scope }`。六个子入口只导出运行时函数，不额外导出类型。`Ref` 来自 `vue`，`Subscribable` / `Scope` 来自 `@slux/core`，`Snapshot` 来自 `@slux/proxy`，`FluxStore` / `MachineSnapshot` / `ObservableState` 来自各自范式包，均按包名从原包导入。

## 不适用的场景

- 在 Options API、`setup()` 之外，或事件处理器 / 异步回调中调用读取函数：会抛错，需在 setup 或 `effectScope.run()` 内调用。
- 期望绑定自动套用 Scope 覆盖值、把覆盖写回全局，或 SSR 自动序列化 / 恢复请求状态：绑定只读全局来源，需调用方自行准备客户端初始数据与 Scope，见根 README 通用约定。
- 需要脱离 Vue 生命周期的长期订阅：直接用 `@slux/core` 的 `effect`。

## 版本、许可与反馈

- 版本：`0.1.0`（`package.json`）。
- 许可：[MIT](../../LICENSE) © itmanyong。
- 仓库：`github.com/itmanyong/slux`（`packages/vue`）。
- 问题反馈：`https://github.com/itmanyong/slux/issues`。
