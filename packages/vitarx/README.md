# @slux/vitarx

把 `@slux/core` 及 6 个范式包的状态接入 **Vitarx 4.1**（peer 为 `vitarx ^4.1.2`）。读取绑定统一以**只读浅 Ref**（`Readonly<ShallowRef<T>>`，用 `.value` 读取）暴露，写入始终走原实例，绑定不提供 setter 也不创建副本。与 ActView 版的关键差别在桥接实现：Vitarx 版在 `isSSR()` 为真时直接返回快照 Ref、不订阅；客户端要求存在 `getActiveScope()`，并**立即订阅**后交给 `onScopeDispose` 清理。本包提供 **ESM + CJS** 双入口。

## 特性与适用场景

| 场景                                                                      | 是否适用 | 说明                                           |
| ------------------------------------------------------------------------- | -------- | ---------------------------------------------- |
| 在 Vitarx 4.1 组件内读取 `signal` / 惰性 `computed` / 任意 `Subscribable` | 适用     | `useSignal` 返回只读浅 Ref                     |
| 在 `createView` 的 `computed` 等响应式计算里用 `.value` 追踪更新          | 适用     | 浅 Ref 不深转换，按引用判定变化                |
| 接入 atom / store / proxy / flux / state-machine / rxjs 范式              | 适用     | 各用对应子入口                                 |
| 服务端 `renderToString(createSSRApp(...))` 输出初始快照                   | 适用     | `isSSR()` 分支不打开订阅                       |
| 需要可写容器、`ref.set`、双向绑定 tuple                                   | 不适用   | 返回值在类型层只读，写入走原实例               |
| 客户端脱离 `createScope` 作用域调用读取 hook                              | 不适用   | 缺少 `getActiveScope()` 时抛错（SSR 分支除外） |
| 需要自动请求级隔离、自动 SSR 序列化 / 恢复                                | 不适用   | 沿用 core 显式覆盖语义，见「专属语义与边界」   |

## 安装

```sh
pnpm add @slux/core @slux/vitarx vitarx
```

- `@slux/core`（`workspace:^`）与 `vitarx`（`^4.1.2`）是**必需 peer**；`@slux/shared` 是运行时依赖，会随包带入。
- **范式包是可选 peer，只装实际使用的**：`@slux/atom`、`@slux/store`、`@slux/proxy`、`@slux/flux`、`@slux/state-machine`、`@slux/rxjs`（均为 `workspace:^`，`peerDependenciesMeta` 标为 `optional`）。
- `exports` 同时含 `import` 与 `require` 条件，提供 ESM（`.js` / `.d.ts`）与 CJS（`.cjs` / `.d.cts`）产物。

`exports` 子入口逐个对应：

| 子入口                       | 所需范式 peer         | 主要导出                                                                     |
| ---------------------------- | --------------------- | ---------------------------------------------------------------------------- |
| `@slux/vitarx`               | `@slux/core`          | `useSignal`、`provideScope`、`useScope`、`SCOPE_KEY`、`createAutoImportApis` |
| `@slux/vitarx/atom`          | `@slux/atom`          | `useAtomValue`、`useSetAtom`、`useAtom`                                      |
| `@slux/vitarx/store`         | `@slux/store`         | `useStore`                                                                   |
| `@slux/vitarx/proxy`         | `@slux/proxy`         | `useSnapshot`                                                                |
| `@slux/vitarx/flux`          | `@slux/flux`          | `useFluxStore`                                                               |
| `@slux/vitarx/state-machine` | `@slux/state-machine` | `useMachine`                                                                 |
| `@slux/vitarx/rxjs`          | `@slux/rxjs`          | `useObservable`                                                              |
| `@slux/vitarx/package.json`  | —                     | 包元信息                                                                     |

## 快速开始

```tsx
import { computed, createApp, createView } from "vitarx";
import { signal } from "@slux/core";
import { useSignal } from "@slux/vitarx";

const count = signal(0);

function Counter() {
  const value = useSignal(count); // Readonly<ShallowRef<number>>
  return createView("span", {
    children: computed(() => String(value.value)),
  });
}

const container = document.createElement("div");
const app = createApp(Counter);
app.mount(container);
count.set(5); // 写入走原 signal
app.unmount(); // 释放绑定订阅
```

在纯响应式作用域中读取，用 Vitarx 原生 `createScope` 包裹并 `dispose()` 释放：

```ts
import { createScope } from "vitarx";
import { computed, signal } from "@slux/core";
import { useSignal } from "@slux/vitarx";

const source = signal(1);
const doubled = computed(() => source.get() * 2);

const scope = createScope();
const value = scope.run(() => useSignal(doubled))!; // Readonly<ShallowRef<number>>
value.value; // 2
source.set(3);
value.value; // 6（惰性 computed 被驱动重算）
scope.dispose(); // 释放订阅与 core effect
```

## 主入口 API

| API                    | 签名                                                      | 说明                                              |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------- |
| `useSignal`            | `<T>(source: Subscribable<T>) => Readonly<ShallowRef<T>>` | 把任意可订阅源桥接为只读浅 Ref                    |
| `provideScope`         | `(scope: Scope) => void`                                  | 在组件初始化中提供 core `Scope`                   |
| `useScope`             | `() => Scope \| undefined`                                | 读取最近的 core `Scope`，无提供时返回 `undefined` |
| `SCOPE_KEY`            | `Symbol.for("slux.vitarx.scope")`                         | 框架注入键                                        |
| `createAutoImportApis` | `(prefix?: string) => ImportsMap`                         | 生成自动导入配置，见「自动导入」                  |

`useSignal` 委托内部 `bindExternal(get, subscribe, equals)`，行为如下：

| 维度                 | 行为                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 读取形式             | `.value`；底层是 `vitarx` 的 `shallowRef`，不做深响应式转换                                                            |
| **SSR 短路**         | `isSSR()` 为真时直接返回 `shallowRef(get())`，**不订阅、不检查作用域**                                                 |
| **客户端作用域要求** | 必须存在 `getActiveScope()`，否则抛 `Error`（消息含 `effect scope`）                                                   |
| **订阅时机**         | 立即 `subscribe(update)` → `onScopeDispose(dispose)` 注册释放 → `update()` 补读最新值（无 `onMounted` 延迟、无微任务） |
| 惰性 computed        | 除 `source.subscribe(notify)` 外，另起 core `effect(() => source.get())` 保持依赖刷新                                  |
| 相等判定             | 默认 `Object.is`；判定相等时不写回 `.value`，保留旧引用                                                                |
| 清理                 | `onScopeDispose` 在 `scope.dispose()` 或组件 `app.unmount()` 时执行                                                    |
| 来源固定             | 绑定创建后 `source` / `selector` 固定，切换需重建组件或作用域                                                          |

## 子入口 API

所有读取绑定都返回**只读浅 Ref**（`Readonly<ShallowRef<…>>`），写入一律通过原实例。

### `@slux/vitarx/atom`

| API            | 签名                                                                           | 返回值     | 写入方式                                             |
| -------------- | ------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------- |
| `useAtomValue` | `<T>(atom: ReadonlyAtom<T>) => Readonly<ShallowRef<T>>`                        | 只读浅 Ref | 只读；可写派生 atom 通过原 `atom.write`              |
| `useSetAtom`   | `<T>(atom: Atom<T>) => (value: T) => void`                                     | setter     | 直接调用 `atom.set(value)`，函数值不会被当成 updater |
| `useAtom`      | `<T>(atom: Atom<T>) => readonly [Readonly<ShallowRef<T>>, (value: T) => void]` | 二元组     | 同 `useSetAtom`                                      |

### `@slux/vitarx/store`

```ts
useStore<T>(store: StoreApi<T>): Readonly<ShallowRef<T>>;
useStore<T, S>(store: StoreApi<T>, selector: (state: T) => S, equals?: (a: S, b: S) => boolean): Readonly<ShallowRef<S>>;
```

`selector` 默认恒等、`equals` 默认 `Object.is`；比较器返回 `true` 时保留上一次结果引用。写入走 `store.setState`。

### `@slux/vitarx/proxy`

`useSnapshot<T extends object>(proxy: T): Readonly<ShallowRef<Snapshot<T>>>`：返回**冻结且结构共享**的快照，订阅整个 proxy 及嵌套变化；通过原 proxy 对象修改状态。

### `@slux/vitarx/flux`

`useFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Readonly<ShallowRef<State>>`，等价于 `useSignal(store)`。写入仍通过 `store.dispatch(action)`。

### `@slux/vitarx/state-machine`

`useMachine<Context, Event extends { type: string }, State extends string>(machine: StateMachine<Context, Event, State>): Readonly<ShallowRef<MachineSnapshot<Context, State>>>`。写入通过 `machine.send(event)`；快照的状态名与上下文分别读作 `ref.value.value`、`ref.value.context`。

### `@slux/vitarx/rxjs`

`useObservable<T>(source: ObservableState<T>): Readonly<ShallowRef<T>>`，接收 `fromObservable` 创建的桥接实例。写入通过上游 Observable / Subject；`status` / `error` 从来源读取，`dispose()` 由桥接创建者负责。

## 专属语义与边界

- **SSR / hydration**：`bindExternal` 在 `isSSR()` 为真时走短路分支，只返回初始快照 Ref，`renderToString(createSSRApp(...))` 不打开组件订阅。服务端不自动序列化、传输或恢复状态，也不改写全局 signal。SSR 与上下文的通用约定见仓库根 [README](../../README.md) 的「框架适配 · 通用约定」。
- **Scope**：`provideScope(scope)` 在组件初始化中调用，后代 `useScope()` 读取；`SCOPE_KEY` 是对应注入键。注意区分 **Vitarx 原生 `createScope()`**（响应式作用域，用于包裹 hook）与 **`@slux/core` 的 `createScope()`**（值隔离容器）：本包的绑定依赖前者，提供的 `Scope` 对象来自后者。Scope 沿用 core 的**显式覆盖**语义：`scope.set(source, 9)` 不会改变组件内 `useSignal(source).value` 的全局读取值，`runInScope` 也不改写全局 signal 读写。
- **订阅与清理**：客户端订阅立即建立，释放统一由 `onScopeDispose` 承担（`scope.dispose()` 或 `app.unmount()`）。卸载只解除**组件自身**绑定；flux / machine / observable 原实例不随之销毁，仍可继续写入，`dispose()` 由调用方负责。
- **快照相等判定**：`bindExternal` 与 `useStore` 默认 `Object.is`；自定义 `equals` 返回 `true` 时保留旧引用并跳过 `.value` 写回。proxy 快照冻结、未修改分支保持原引用。
- **错误处理**：绑定层不额外捕获异常、不吞错、不回滚写入；`source.get` / `subscribe` / core `effect` 抛出的错误按 `@slux/core` 的语义传播。

## 自动导入

`createAutoImportApis(prefix?)` 基于 `@slux/shared` 的 `generateBatchAutoImports` 返回 `unplugin-auto-import` 的 `ImportsMap`，来源名为 `@slux/vitarx`。登记清单（取自 `src/auto-import-api.ts` 的 `allImportApis`）：

`SCOPE_KEY`、`provideScope`、`useScope`、`useSignal`

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/vitarx";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

传入前缀会为登记项生成别名；前缀以小写字母结尾时 API 名首字母大写，规则由 `@slux/shared` 的 `createAutoImports` 统一决定。

## 类型导出

主入口 `src/index.ts` 与各子入口均**不 re-export 类型**，所需类型从来源包导入：

| 用到的类型                        | 来源                  |
| --------------------------------- | --------------------- |
| `Subscribable<T>`、`Scope`        | `@slux/core`          |
| `ShallowRef<T>`                   | `vitarx`              |
| `ReadonlyAtom<T>`、`Atom<T>`      | `@slux/atom`          |
| `StoreApi<T>`                     | `@slux/store`         |
| `Snapshot<T>`                     | `@slux/proxy`         |
| `FluxStore`、`FluxAction`         | `@slux/flux`          |
| `MachineSnapshot`、`StateMachine` | `@slux/state-machine` |
| `ObservableState<T>`              | `@slux/rxjs`          |

## 不适用的场景

- 需要可写 ShallowRef / 在绑定上直接 `set`：返回值在类型层只读，请用原实例写入。
- 客户端在 `createScope` 作用域之外调用 `useSignal` 等 hook：会抛错（`isSSR()` 分支除外）。
- 需要框架自动做请求级状态隔离或 SSR 状态恢复：需按 core 的 `Scope` 与服务端约定自行实现。
- 把 Vitarx 原生 `createScope()` 当作 core 的值隔离容器使用：二者同名但职责不同。

## 版本、许可与反馈

- 版本：`0.1.0`（`package.json`）。
- 许可：MIT，见仓库根 [LICENSE](../../LICENSE)。
- 问题反馈：通过 [issues](https://github.com/itmanyong/slux/issues) 提交（`package.json` `repository`）。
- 通用约定（子入口分布、写入方式、桥接生命周期、Scope、SSR）与本地开发命令见仓库根 [README](../../README.md) 的「框架适配 · 通用约定」与「本地开发」，本文不重复。
