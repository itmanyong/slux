# @slux/angular

Angular 22（`@angular/core@^22.0.0`、`rxjs@^7.8.0`）的 slux 绑定，基于 `@slux/core` 的 `Subscribable<T>` 订阅模型。原生绑定形式是 **只读 Angular `Signal<T>` 与 RxJS `Observable` 桥接**：在注入上下文中把可订阅源转成 `Signal<T>`，并通过 `DestroyRef` 自动清理订阅。所有写入仍走原实例，绑定只读。

## 特性与适用场景

| 项       | 说明                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------- |
| 绑定形式 | `toAngularSignal(source)` 返回只读 `Signal<T>`；`toObservable` / `fromObservable` 提供双向桥接 |
| 框架依赖 | `@angular/core`（`signal`、`inject`、`DestroyRef`、`InjectionToken`）、`rxjs`（`Observable`）  |
| 范式覆盖 | core 主入口 + atom / store / proxy / flux / state-machine / rxjs 六个子入口                    |
| 清理     | `DestroyRef.onDestroy` 退订，注入器 / 组件销毁后停止驱动 core computed                         |

| 场景                                                      | 是否适合 | 说明                                                    |
| --------------------------------------------------------- | -------- | ------------------------------------------------------- |
| 在 Angular 组件 / 注入工厂里读 core `signal` / `computed` | 适合     | `toAngularSignal` 返回只读 Signal，模板用 `value()`     |
| 需要把 slux 源接入 RxJS 管道                              | 适合     | `toObservable(source)` 得到 `Observable<T>`             |
| 需要把 RxJS 流接成 `Subscribable`                         | 适合     | `fromObservable(observable, initialValue)` 引用计数桥接 |
| 用 atom / store / proxy 或新增三种范式                    | 适合     | 从对应子入口导入，范式包按需安装                        |
| 需要绑定替你写入状态                                      | 不适合   | 只读 Signal，写入走 `set` / `dispatch` / `send`         |
| 在注入上下文外直接调用绑定                                | 不适合   | 需 `runInInjectionContext` 或传 `{ injector }`          |

## 安装

```sh
pnpm add @slux/core @slux/angular @angular/core@^22 rxjs@^7.8
```

- **必需 peer**：`@slux/core`（`workspace:^`）、`@angular/core@^22.0.0`、`rxjs@^7.8.0`。`rxjs` 是必需 peer，因为主入口 `bridge.ts` 直接使用 `Observable`。
- **可选 peer（范式包）**：`@slux/atom`、`@slux/store`、`@slux/proxy`、`@slux/flux`、`@slux/state-machine`、`@slux/rxjs` 均为 `optional`，**只装实际使用的子入口**。
- `@slux/shared` 是本包运行时依赖，安装时自动带入。
- 主入口与每个子入口都通过 `exports` 同时提供 ESM（`import`）、CJS（`require`）与 `.d.ts` / `.d.cts` 类型声明。

`package.json` 的 `exports` 子入口（逐个列出）：

| 子路径                        | 导出内容                                                                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@slux/angular`               | 主入口：`SLUX_SCOPE`、`provideSluxScope`、`injectScope`、`toObservable`、`fromObservable`、`toAngularSignal`、`injectStore`、`createAutoImportApis` 及两个类型 |
| `@slux/angular/atom`          | `injectAtomValue`、`injectSetAtom`、`injectAtom`                                                                                                               |
| `@slux/angular/store`         | `injectStore`、`InjectStoreOptions`                                                                                                                            |
| `@slux/angular/proxy`         | `injectSnapshot`                                                                                                                                               |
| `@slux/angular/flux`          | `injectFluxStore`                                                                                                                                              |
| `@slux/angular/state-machine` | `injectMachine`                                                                                                                                                |
| `@slux/angular/rxjs`          | `injectObservable`                                                                                                                                             |
| `@slux/angular/package.json`  | 包元数据（非 API）                                                                                                                                             |

> `injectStore` 同时从主入口与 `/store` 子入口导出，是同一个函数；主入口通过 `./store.js` 重新导出。

## 快速开始

```ts
import { Component } from "@angular/core";
import { signal } from "@slux/core";
import { toAngularSignal } from "@slux/angular";

const count = signal(0);

@Component({ selector: "app-counter", template: "{{ value() }}" })
export class Counter {
  readonly value = toAngularSignal(count);
}
```

字段初始化器处于 Angular 注入上下文中，`toAngularSignal` 可直接 `inject(DestroyRef)`；模板用 `value()` 读取。`count.set(...)` 写入后 Signal 随之更新。

## 主入口 API

| 成员                   | 签名                                                                             | 行为                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SLUX_SCOPE`           | `InjectionToken<Scope>`                                                          | Scope 的环境 provider token                                                                                                                                       |
| `provideSluxScope`     | `(scope: Scope) => EnvironmentProviders`                                         | `makeEnvironmentProviders([{ provide: SLUX_SCOPE, useValue: scope }])`；构造 provider，不需注入上下文                                                             |
| `injectScope`          | `() => Scope \| undefined`                                                       | `inject(SLUX_SCOPE, { optional: true }) ?? undefined`；**需注入上下文**                                                                                           |
| `toObservable`         | `<T>(source: Subscribable<T>) => Observable<T>`                                  | 订阅时同步发当前值 → 订阅后续变化 + core `effect` 驱动 → 建立后再比对一次最新值；退订释放二者；不需注入上下文                                                     |
| `fromObservable`       | `<T>(source: Observable<T>, initialValue: T) => Subscribable<T>`                 | 引用计数桥接；`get()` 返回最近值；`subscribe` 不同步调用新监听者；首 / 末监听者连接 / 断开上游；不需注入上下文                                                    |
| `toAngularSignal`      | `<T>(source: Subscribable<T>, options?: ToAngularSignalOptions<T>) => Signal<T>` | 创建 `signal(source.get(), { equal })`，订阅 `toObservable(source)` 把值写回，`DestroyRef.onDestroy` 退订，返回 `asReadonly()`；**需注入上下文或 `{ injector }`** |
| `injectStore`          | 见「子入口 API」                                                                 | 主入口重新导出 `/store` 的 `injectStore`                                                                                                                          |
| `createAutoImportApis` | `(prefix?: string) => ImportsMap`                                                | 生成 `unplugin-auto-import` 配置，见「自动导入」                                                                                                                  |

`ToAngularSignalOptions<T>`：

```ts
type ToAngularSignalOptions<T> = {
  readonly equal?: (previous: T, next: T) => boolean;
  readonly injector?: Injector;
};
```

- `equal`：传给 Angular `signal` 的相等判定；判定相等时保留旧值引用，不触发变更。
- `injector`：显式注入器，用于 `injector.get(DestroyRef)`，使 `toAngularSignal` 能在注入上下文外创建。

### 注入上下文要求

`toAngularSignal` 内部调用 `inject(DestroyRef)`，因此**所有基于它的绑定**（`injectAtomValue`、`injectAtom`、`injectSnapshot`、`injectStore`、`injectFluxStore`、`injectMachine`、`injectObservable`）必须在 Angular 注入上下文中调用：组件 / 指令字段初始化、构造函数、注入工厂或 `runInInjectionContext`；否则传入 `{ injector }`。`injectScope` 同样使用 `inject(...)`，也需注入上下文。

`toObservable`、`fromObservable`、`injectSetAtom`、`provideSluxScope`、`SLUX_SCOPE` 不需要注入上下文。

```ts
import { Injector, runInInjectionContext } from "@angular/core";
import { createScope, signal } from "@slux/core";
import { SLUX_SCOPE, injectScope, toAngularSignal } from "@slux/angular";

const source = signal(1);
const scope = createScope();
scope.set(source, 20);

const injector = Injector.create({
  providers: [{ provide: SLUX_SCOPE, useValue: scope }],
});

runInInjectionContext(injector, () => {
  const value = toAngularSignal(source); // 只读 Signal<number>
  const covered = injectScope()!.get(source); // 显式读取 Scope 覆盖值
  void value();
  void covered;
});
```

`provideSluxScope(scope)` 返回 `EnvironmentProviders`，供应用 / 路由的 `providers` 数组使用（例如 `bootstrapApplication` / `createApplication` 的配置）。

## 子入口 API

### `@slux/angular/atom`

| 导出              | 签名                                                                                           | 返回值 / 写入                             |
| ----------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `injectAtomValue` | `<T>(source: AnyReadableAtom<T>, options?: ToAngularSignalOptions<T>) => Signal<T>`            | 只读 Signal，支持只读派生 atom            |
| `injectSetAtom`   | `<T>(source: Atom<T>) => (value: T) => void`                                                   | 只创建 setter，不订阅，**不需注入上下文** |
| `injectAtom`      | `<T>(source: Atom<T>, options?: ToAngularSignalOptions<T>) => [Signal<T>, (value: T) => void]` | `[只读 Signal, setter]`                   |

setter 按 atom 替换契约写值，函数值不会被当作 updater 执行。

### `@slux/angular/store`

`InjectStoreOptions<T> = ToAngularSignalOptions<T>`。`injectStore` 有两个重载：

| 调用                                     | 返回值                      |
| ---------------------------------------- | --------------------------- |
| `injectStore(store, options?)`           | `Signal<State>`（完整状态） |
| `injectStore(store, selector, options?)` | `Signal<Selection>`（选值） |

`selector = (state: State) => Selection`；`options.equal` 判定相等时保留旧选值引用。写入仍用 `store.setState(...)`。

```ts
import { Component } from "@angular/core";
import { createStore } from "@slux/store";
import { injectStore } from "@slux/angular/store";

const store = createStore(() => ({ count: 1, name: "a" }));

@Component({ selector: "app-count", template: "{{ count() }}" })
export class Count {
  readonly count = injectStore(store, (state) => state.count);
}
```

### `@slux/angular/proxy`

| 导出             | 签名                                                                                                  | 返回值                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `injectSnapshot` | `<T extends object>(source: T, options?: ToAngularSignalOptions<Snapshot<T>>) => Signal<Snapshot<T>>` | 整个 proxy 的深只读、冻结快照，无字段访问追踪 |

### 新增三种范式（只读）

| 子路径                        | 导出               | 签名                                                                                                                                                                                                                          | 返回值        | 写入方式                 |
| ----------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------ |
| `@slux/angular/flux`          | `injectFluxStore`  | `<State, Action extends FluxAction>(store: FluxStore<State, Action>, options?: ToAngularSignalOptions<State>) => Signal<State>`                                                                                               | Flux 完整状态 | `store.dispatch(action)` |
| `@slux/angular/state-machine` | `injectMachine`    | `<Context, Event extends { type: string }, State extends string>(machine: StateMachine<Context, Event, State>, options?: ToAngularSignalOptions<MachineSnapshot<Context, State>>) => Signal<MachineSnapshot<Context, State>>` | 状态机快照    | `machine.send(event)`    |
| `@slux/angular/rxjs`          | `injectObservable` | `<T>(source: ObservableState<T>, options?: ToAngularSignalOptions<T>) => Signal<T>`                                                                                                                                           | 桥接最近值    | 桥接创建者持有上游       |

三者内部都复用 `toAngularSignal`，因此同样受注入上下文 / `{ injector }` 与 `equal` 约束。

## 专属语义与边界

- **注入上下文**：见上文。`toAngularSignal` 调用时即通过 `toObservable(source).subscribe(...)` 建立订阅，清理依赖 `DestroyRef.onDestroy`；注入器 / 组件销毁后订阅与 core `effect` 一起释放，停止驱动惰性 computed。
- **销毁边界**：销毁只解除本组件建立的绑定订阅，**不销毁**业务 store / flux / machine / observable；桥接创建者负责调用 `dispose()`。销毁后 Signal 保留最后值，不再更新。
- **Scope 边界**：Scope 通过 `SLUX_SCOPE` 显式注入。**`toAngularSignal` 读取全局值，不自动应用 Scope 覆盖值**；需要覆盖值时调用 `injectScope()?.get(source)` 显式读取。`scope.set()` 不触发全局订阅，computed 不在 Scope 内自动重算（通用约定见仓库根 README）。这与用 `getServerSnapshot` 自动应用 Scope 的框架绑定不同。
- **SSR**：本包不提供独立的服务端入口；`toObservable` 以 `source.get()` 作为同步首值，`toAngularSignal` 调用时即建立订阅并挂到 `DestroyRef`，清理随注入器销毁发生。SSR 的请求隔离与状态准备约定见 [仓库根 README](../../README.md) 的「框架适配 · 通用约定」。
- **Observable 桥接细节**：`toObservable` 订阅时先 `next(source.get())`；若首值后订阅已关闭则直接返回；随后建立 `source.subscribe` 与 core `effect`，再读一次 `source.get()`，与首值不同时补发一次（覆盖 `effect` 驱动 computed 后得到的新值）；退订释放二者。`fromObservable` 的 `get()` 返回最近值，`subscribe` 遵守 core 契约**不同步调用**新监听者，同步首值通过 `get()` 读取；`error` 回调为空实现，保留最后值，业务应在上游用 `catchError` 处理；完成同样保留最后值。
- **快照相等判定**：`equal` 直接传给 Angular `signal`；`injectStore` 的 `equal`（`InjectStoreOptions`）用于过滤相等的选值。`@slux/proxy` 的 `snapshot` 为冻结、结构共享的深只读快照，未变分支保持引用。
- **错误处理**：绑定层不新增错误包装；`fromObservable` 的 `error` 不抛出、不重试。RxJS 桥接的完成 / 错误状态由 `@slux/rxjs` 的 `status` / `error` 只读信号读取；写入、通知与 `effect` 的错误行为遵循 `@slux/core`。
- **通用约定**：跨框架写入形式、Scope、SSR 与桥接生命周期约定见 [仓库根 README](../../README.md) 的「框架适配 · 通用约定」；仓库内验证命令见「本地开发」，本文不重复。

## 自动导入

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/angular";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

`createAutoImportApis(prefix = "")` 的登记清单以 `src/auto-import-api.ts` 的 `allImportApis` 为准，当前为 **`SLUX_SCOPE`、`fromObservable`、`injectScope`、`injectStore`、`provideSluxScope`、`toAngularSignal`、`toObservable`** 七项，来源名 `@slux/angular`。传入前缀可生成别名，大写规则由 `@slux/shared` 的 `generateBatchAutoImports` 决定。清单**只含主入口运行时导出**，不含 `createAutoImportApis` 自身、两个类型，也不含任何子入口的注入函数。

## 类型导出

| 类型                        | 导出位置                               | 用途                               |
| --------------------------- | -------------------------------------- | ---------------------------------- |
| `ToAngularSignalOptions<T>` | 主入口（`bridge.ts`）                  | `{ equal?, injector? }` 桥接选项   |
| `InjectStoreOptions<T>`     | 主入口与 `/store` 子入口（`store.ts`） | 等价于 `ToAngularSignalOptions<T>` |

其余子入口没有显式 `export type`；`Signal<T>` / `Injector` / `EnvironmentProviders` 来自 `@angular/core`，`Scope` / `Subscribable<T>` 来自 `@slux/core`，`AnyReadableAtom` / `Atom`、`StoreApi`、`Snapshot`、`FluxStore` / `FluxAction`、`MachineSnapshot`、`ObservableState` 等通过函数签名暴露，从各自范式包导入。

## 不适用的场景

- 既不在注入上下文、又不传 `{ injector }` 就调用 `toAngularSignal` / `inject*`：用 `runInInjectionContext` 包裹或传显式注入器。
- 需要绑定写入状态：返回的是 `asReadonly()` Signal，写入必须走原实例。
- 需要自动把 Scope 覆盖值应用到 Signal：Angular 用 `injectScope()?.get(source)` 显式读取。
- 非 Angular 运行时：用 `@slux/core` 或对应框架的绑定包。

## 版本、许可与反馈

- 版本：`0.1.0`（`package.json`）；许可：[MIT](../../LICENSE) © itmanyong。
- 问题反馈：`https://github.com/itmanyong/slux/issues`。
- 通用约定与本地开发命令见 [仓库根 README](../../README.md)。
