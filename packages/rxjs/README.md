# @slux/rxjs

RxJS `Observable` 与 `@slux/core` 的 `Subscribable` 之间的双向桥接：`toObservable` 把 core 状态源包成 `Observable`，`fromObservable` 把 `Observable` 转成带 `status` / `error` / `dispose` 生命周期的 `ObservableState`。实现直接写在 `src/index.ts`，组合 core 的 `signal` / `effect` / `batch` 与 rxjs 的 `Observable`，**不是对其他实现文件的重导出**。

## 特性与适用场景

| 场景                                                       | 是否适合 | 说明                                                               |
| ---------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| 已有 RxJS 流要接入 core 的 `computed` / `effect` / `batch` | 适合     | `fromObservable` 转成可读信号                                      |
| 要把 core `signal` / `computed` 暴露给 RxJS operator 管道  | 适合     | `toObservable` 会主动驱动惰性 `computed`                           |
| 多个组件/消费者共享同一份上游订阅                          | 适合     | `ObservableState` 可被多处读取，退订互不影响                       |
| 需要完整 RxJS 操作符、调度器、多播语义                     | 不适合   | 本包只做桥接，操作符用 `rxjs` 本身                                 |
| 需要保留源里每个事件、不做相等性去重                       | 不适合   | 按 core `Object.is` 去重并受 `batch` 合并；直接订阅原 `Observable` |

## 安装

```sh
pnpm add @slux/rxjs rxjs
```

| 项                 | 值                                                                     | 来源                     |
| ------------------ | ---------------------------------------------------------------------- | ------------------------ |
| 版本               | `0.1.0`                                                                | `package.json`           |
| `dependencies`     | `@slux/core` `workspace:*`、`@slux/shared` `workspace:*`               | `package.json`           |
| `peerDependencies` | `rxjs: ^7.8.0`，**必需**（未配置 `peerDependenciesMeta.optional`）     | `package.json`           |
| `devDependencies`  | `rxjs: catalog:`（仅本包开发与测试用）                                 | `package.json`           |
| 模块格式           | ESM（`dist/index.js`）+ CJS（`dist/index.cjs`），带 `.d.ts` / `.d.cts` | `package.json` `exports` |
| 许可               | MIT                                                                    | `package.json`           |

`rxjs` 是**必需的** peer 依赖，未安装时 `fromObservable` / `toObservable` 无法解析 `rxjs`；`@slux/core`、`@slux/shared` 是本包 `dependencies`，安装时一并带入。下文示例直接 `import` 了 `@slux/core` 与 `rxjs`，应用代码应显式声明：`pnpm add @slux/core @slux/rxjs rxjs`。Node.js 版本要求与跨包通用约定见仓库根 [README.md](../../README.md)。

## 快速开始

```ts
import { computed, signal } from "@slux/core";
import { fromObservable, toObservable } from "@slux/rxjs";
import { Subject } from "rxjs";

// core 状态 → RxJS Observable
const count = signal(1);
const doubled = computed(() => count.get() * 2);
const sub = toObservable(doubled).subscribe((value) => {
  console.log("doubled:", value); // 立即输出 2
});
count.set(2); // 4

// RxJS Observable → core 状态
const events = new Subject<number>();
const state = fromObservable(events, 0);
events.next(42);
console.log(state.get(), state.status.get()); // 42 "active"

sub.unsubscribe();
state.dispose();
```

## 核心 API

运行时导出共三个函数：`toObservable`、`fromObservable`（定义在 `src/index.ts`）与 `createAutoImportApis`（从 `src/auto-import-api.ts` 重导出）。

### `toObservable<T>(source: Subscribable<T>): Observable<T>`

把任意满足 `Subscribable<T>`（有 `get()` + `subscribe()`）的 core 状态源转成 Observable。

| 行为          | 说明                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| 首值          | 每次订阅时同步 `source.get()` 并 `next` 当前值                                                                      |
| 后续变化      | 订阅 `source.subscribe(...)`，变化即 `next`；遵守 core 的 `Object.is` 相等性与 `batch` 合并（同一批次只通知最终值） |
| 惰性 computed | 额外挂一个内部 `effect(() => source.get())` 主动读取，`computed` 才会产出后续通知；退订后停止派生计算               |
| 同步关闭      | 首值或连接阶段 `subscriber.closed`（如 `take(1)`）时立即返回，不建立后续订阅                                        |
| 首值重入      | 首值回调可能在订阅建立前写入源，连接结束时再读一次 `source.get()`，与首值不同则补发最新值                           |
| 清理          | RxJS 退订通过 teardown 移除源订阅与内部 `effect`                                                                    |
| 错误          | 读取源时抛出的异常进入 RxJS `error` 通道并终止该订阅                                                                |
| 完成          | `Subscribable` 没有完成通道，输出**不会自行 complete**；也不把 `ObservableState.status` 映射为 RxJS 终止事件        |

```ts
import { computed, signal } from "@slux/core";
import { toObservable } from "@slux/rxjs";
import { map, take } from "rxjs";

const count = signal(1);
const doubled = computed(() => count.get() * 2);
const sub = toObservable(doubled)
  .pipe(map((value) => `结果：${value}`))
  .subscribe(console.log);
count.set(2);
sub.unsubscribe();
```

### `fromObservable<T>(source: Observable<T>, initialValue: T): ObservableState<T>`

| 行为       | 说明                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 订阅次数   | 创建时**立即且只订阅一次**源，不随消费者增减重新订阅；冷源每个桥接实例执行一次，热源只接收创建之后的事件                                         |
| 初始值     | 必须显式提供且类型匹配 `T`；同步 `of(...)` 可能在函数返回前已更新或完成，`EMPTY` 保留初始值并置 `complete`                                       |
| `next`     | 写入 core `signal`：函数值用 `value.set(() => nextValue)` 保存（不会被当成 recipe 执行），`undefined` 直接写入                                   |
| `error`    | 在同一个 core `batch` 内更新 `error` 信号与 `status = "error"`；错误值可能是 `undefined`，须用 `status` 判断；函数类型的错误原因同样按普通值保存 |
| `complete` | `status = "complete"`，保留最后值，不自动重试                                                                                                    |
| `dispose`  | 取消上游订阅并把 `status` 置 `"disposed"`，保留最后值与已有错误；幂等，销毁后上游不再更新值                                                      |

`ObservableState<T>` 结构（`src/index.ts` 内联定义）：

| 成员                  | 类型                                     | 说明                                              |
| --------------------- | ---------------------------------------- | ------------------------------------------------- |
| `get()`               | `() => T`                                | 当前值；在 `computed` / `effect` 内读取会收集依赖 |
| `subscribe(callback)` | `(cb: (value: T) => void) => () => void` | 订阅后续变化，不立即调用，返回幂等取消函数        |
| `status`              | `ReadonlySignal<ObservableStatus>`       | 只读信号，见下方生命周期表                        |
| `error`               | `ReadonlySignal<unknown>`                | 只读信号，记录源错误，初始为 `undefined`          |
| `dispose()`           | `() => void`                             | 取消上游订阅并销毁桥接                            |

`ObservableStatus` = `"active" | "complete" | "error" | "disposed"`，生命周期：

| 阶段 | `status`   | 触发                                             |
| ---- | ---------- | ------------------------------------------------ |
| 创建 | `active`   | 初始值写入，`error` 为 `undefined`               |
| 完成 | `complete` | 源 `complete()`                                  |
| 错误 | `error`    | 源 `error(reason)`，错误值与状态在同一批次可观察 |
| 销毁 | `disposed` | `dispose()`，覆盖之前任何状态                    |

```ts
import { effect } from "@slux/core";
import { fromObservable } from "@slux/rxjs";
import { Subject } from "rxjs";

const events = new Subject<number>();
const state = fromObservable(events, 0);
const stop = effect(() => {
  console.log(state.get(), state.status.get(), state.error.get());
});
events.next(1);
stop();
state.dispose();
```

## 关键语义与边界

- **依赖收集**：`get()` 走 core `value.get`，`status` / `error` 也是可读信号，都可在 `computed` / `effect` 内观察；`subscribe` 仅通知后续变化，首值请用 `get()` 读取。
- **通知时机与批处理**：`next` 写入走 core `signal`，遵守 `Object.is` 相等性与 `batch` 合并；同一批次只通知最终值。需要保留每个事件时直接订阅原始 `Observable`。
- **错误**：`toObservable` 的读取异常进入 RxJS `error` 通道；`fromObservable` 的源错误记录到 `error` 信号并把 `status` 置 `"error"`，**不自动重试、不抛给消费者**。错误值可能是 `undefined`，判断失败请用 `status.get() === "error"`。
- **清理**：`toObservable` 由 RxJS 退订清理；`fromObservable` 的 `dispose()` 由**桥接创建者**负责。消费者/组件退订只移除自己的订阅，不销毁共享桥接；即使暂时没有消费者，桥接仍接收上游更新直到 `complete` / `error` / `dispose`。
- **异步**：异步源首值到达前使用初始值；销毁后到达的异步结果被忽略（值不再更新，`status` 保持 `"disposed"`）。
- **其他**：桥接不自动完成、不自动重试、不做序列化；函数值与 `undefined` 都按普通值保存。框架适配侧「不重复创建上游订阅、组件卸载只解除自身绑定」等通用约定见仓库根 [README.md](../../README.md) 的「框架适配 · 通用约定」一节。

## 自动导入

`createAutoImportApis(prefix?)` 返回 `unplugin-auto-import` 的 `ImportsMap`。登记清单以 `src/auto-import-api.ts` 的 `allImportApis` 为准，当前是 `fromObservable`、`toObservable` 两个桥接函数，来源名为 `@slux/rxjs`（`createAutoImportApis` 本身不登记）。

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/rxjs";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

默认无前缀；传入**以小写字母结尾**的前缀时，别名会把 API 名首字母大写（如 `createAutoImportApis("u")` → `uFromObservable`、`uToObservable`）。大小写规则由 `@slux/shared` 的 `generateBatchAutoImports` / `createAutoImports` 决定。

## 类型导出

以 `src/index.ts` 的 `export type` 为准，共 2 个，均在 `index.ts` 内联定义：

| 类型                 | 用途                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `ObservableStatus`   | `"active" \| "complete" \| "error" \| "disposed"` 状态枚举                              |
| `ObservableState<T>` | `fromObservable` 返回类型：`Subscribable<T>` 加上只读 `status` / `error` 与 `dispose()` |

`ReadonlySignal` / `Subscribable` 是从 `@slux/core` `import type` 供内部使用，**不由本包重新导出**；需要这些类型请从 `@slux/core` 导入。

## 不适用的场景 / 与其他包分工

- 与 `@slux/core`：core 提供 signal / effect / batch；本包只做 `Observable ↔ Subscribable` 转换。
- 与 `@slux/flux` / `@slux/store` / `@slux/state-machine`：那些是状态组织范式；本包不组织状态，只负责把流接入 core 响应式图。
- 需要完整 RxJS 操作符、调度器、多播或 subject 编排，用 `rxjs` 本身；本包不重导出 rxjs 的任何 API。
- `fromObservable` 每次调用都会建立新的上游订阅，不要在渲染函数里重复调用；框架适配侧的通用约定见仓库根 [README.md](../../README.md) 的「框架适配 · 通用约定」一节。

## 版本、许可与反馈

- 版本：`0.1.0`（`package.json`）。
- 许可：MIT，见仓库根 [LICENSE](../../LICENSE)。
- 问题反馈：`https://github.com/itmanyong/slux/issues`（`package.json` `bugs.url`）。
