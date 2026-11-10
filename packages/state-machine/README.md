# @slux/state-machine

基于 `@slux/core` 的轻量**平面**有限状态机。内部用一个 core `Signal<MachineSnapshot>` 保存当前 `{ value, context }`：`send(event)` 选择通过 guard 的转换、顺序执行 action，在 core `batch` 内一次提交新快照。**这是平面状态机范式，不是 XState 兼容实现**；不提供层级状态、并行状态、计时器、actor、异步转换或 entry/exit action（逐项依据见「能力边界」）。

## 特性与适用场景

| 场景                                       | 是否适合 | 说明                                                        |
| ------------------------------------------ | -------- | ----------------------------------------------------------- |
| 少量离散状态，事件驱动的显式转换表         | 适合     | `initial` / `context` / `states` 配置，转换在创建时校验     |
| 需要按条件选择转换、按序更新上下文         | 适合     | `guard` 过滤候选、`actions` 顺序执行并返回新 `context`      |
| 想和 `computed` / `effect` / `batch` 组合  | 适合     | `StateMachine` 满足 core 的 `Subscribable<MachineSnapshot>` |
| 需要层级/并行状态、计时器、actor、异步转换 | 不适合   | 见「能力边界」，改用 XState 等完整状态机库                  |
| 需要任意结构的 reducer 状态流转            | 不适合   | 本包状态是离散 `State` 字符串；改用 `@slux/flux`            |

## 安装

```sh
pnpm add @slux/state-machine
```

| 项                 | 值                                                                     | 来源                     |
| ------------------ | ---------------------------------------------------------------------- | ------------------------ |
| 版本               | `0.1.0`                                                                | `package.json`           |
| `dependencies`     | `@slux/core` `workspace:*`、`@slux/shared` `workspace:*`               | `package.json`           |
| `peerDependencies` | 无                                                                     | `package.json`           |
| 模块格式           | ESM（`dist/index.js`）+ CJS（`dist/index.cjs`），带 `.d.ts` / `.d.cts` | `package.json` `exports` |
| 许可               | MIT                                                                    | `package.json`           |

`@slux/core`、`@slux/shared` 是本包 `dependencies`，安装时一并带入。Node.js 版本要求与跨包通用约定见仓库根 [README.md](../../README.md)。

## 快速开始

```ts
import { createMachine } from "@slux/state-machine";

type Context = { count: number };
type Event = { type: "ADD"; amount: number } | { type: "FINISH" };
type State = "active" | "done";

const machine = createMachine<Context, Event, State>({
  initial: "active",
  context: { count: 0 },
  states: {
    active: {
      on: {
        ADD: {
          guard: (_context, event) => event.amount > 0,
          actions: (context, event) => ({ count: context.count + event.amount }),
        },
        FINISH: "done",
      },
    },
    done: {},
  },
});

const stop = machine.subscribe((snapshot) => {
  console.log(snapshot.value, snapshot.context.count);
});

machine.send({ type: "ADD", amount: 2 }); // { value: "active", context: { count: 2 } }
console.log(machine.can({ type: "FINISH" })); // true，不执行 action
machine.send({ type: "FINISH" });
console.log(machine.matches("done")); // true
stop();
machine.destroy();
```

事件使用带 `type` 的判别联合；配置中的 `guard` / `actions` 按事件名获得对应载荷类型。**带事件载荷的机器建议显式传入三个泛型**，TypeScript 无法从回调参数反推完整事件联合。

## 核心 API

`createMachine<Context, Event extends { type: string }, State extends string>(config: MachineConfig): StateMachine<Context, Event, State>`

### 配置结构

| 字段      | 类型                                | 说明                                 |
| --------- | ----------------------------------- | ------------------------------------ |
| `initial` | `State`                             | 初始状态，必须是 `states` 的自身属性 |
| `context` | `Context`                           | 初始上下文，可为对象、原始值或函数   |
| `states`  | `Record<State, MachineStateConfig>` | 每个状态的 `on` 事件表               |

`MachineStateConfig.on` 的键是 `Event["type"]`，值可以是单个转换配置或其候选数组：

| 写法                                           | 说明                                          |
| ---------------------------------------------- | --------------------------------------------- |
| `on: { EVENT: "target" }`                      | 字符串：直接转到目标状态，无 guard / action   |
| `on: { EVENT: { target?, guard?, actions? } }` | 对象形式，逐字段见下表                        |
| `on: { EVENT: [c1, c2, ...] }`                 | 候选数组，按声明顺序取第一个通过 guard 的候选 |

`MachineTransition` 字段：

| 字段       | 类型                                                           | 说明                                                   |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| `target?`  | `State`                                                        | 省略则停留在当前状态；仍可更新 `context` 或执行 action |
| `guard?`   | `MachineGuard<Context, Event>` = `(context, event) => boolean` | 同步纯函数；返回 `false` 跳过该候选                    |
| `actions?` | `MachineAction` 或其只读数组                                   | `(context, event) => Context \| void`，按顺序执行      |

```ts
// 同一事件按 guard 优先级选择一个转换
const machine = createMachine<number, { type: "NEXT" }, "active" | "done">({
  initial: "active",
  context: 0,
  states: {
    active: {
      on: { NEXT: [{ guard: (count) => count >= 2, target: "done" }, { actions: (count) => count + 1 }] },
    },
    done: {},
  },
});
```

### `StateMachine` 方法

| 方法                  | 签名                                     | 行为                                                                                       |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| `get()`               | `() => MachineSnapshot<Context, State>`  | 当前快照 `{ readonly value; readonly context }`；在 `computed` / `effect` 内读取会收集依赖 |
| `subscribe(callback)` | `(cb: (snapshot) => void) => () => void` | 订阅**后续**快照变化，不立即调用，回调只接收当前快照，返回幂等取消函数                     |
| `send(event)`         | `(event: Event) => MachineSnapshot`      | 同步执行转换，返回该次结果快照                                                             |
| `matches(state)`      | `(state: State) => boolean`              | 当前 `value` 是否等于 `state`（内部读 `source.get()`，参与依赖追踪）                       |
| `can(event)`          | `(event: Event) => boolean`              | 是否存在可用转换；会运行 guard、不执行 action；销毁后恒为 `false`                          |
| `destroy()`           | `() => void`                             | 幂等；释放全部订阅、取消未送达通知、停止后续发送                                           |

### 转换与提交规则

- 创建时校验 `initial` 与**所有候选中的 `target`**，必须定义在 `states` 里，否则抛错；配置在创建时编译复制，之后修改配置不影响已创建机器。
- 取当前状态 `on` 表中 `event.type` 的候选，选第一个「无 `guard` 或 `guard(context, event)` 为 `true`」的；后续候选不执行。空数组或全部拒绝表示无可用转换。
- `actions` 顺序执行，每个 action 接收**前一步** context；返回非 `undefined` 值作为新 context，返回 `undefined` / `void` 保留前一步。上下文可为对象、原始值或函数；`undefined` 是保留标记，不能把已有上下文重置成 `undefined`。
- 提交条件：`value = target ?? current.value`，仅当 `value !== current.value || !Object.is(context, current.context)` 时写入新快照并通知；否则**保持原快照引用且不通知**。上下文用 `Object.is` 判断变化。
- 快照字段在类型层只读；上下文没有深冻结或自动克隆，action 必须用返回值表达更新，直接修改收到的 context 无法回滚也不会触发通知。

## 关键语义与边界

- **依赖收集**：`get()` 与 `matches()` 都走 core `source.get()`，在 `computed` / `effect` 内读取会收集依赖；`send()` / `can()` 读的是闭包内的当前快照，**不会**把 `effect` 订阅到机器状态。
- **通知时机**：每次 `send()` 自带 core `batch`，guard / action 同步算完结果后一次 `source.set`；订阅回调在 batch 退出后触发，因此回调里可再次 `send()` 下一事件，且此时 `get()` 可能已读到后续事件更新。`subscribe` 不立即调用回调。
- **批处理**：外层 `batch()` 可合并多次 `send()` 与其他 core 写入的通知；批处理内仍可立即读取最新值。
- **错误**：
  - guard / action 抛错 → 不提交本次状态与上下文，`sending` 锁在 `finally` 中释放，之后可继续 `send()`；已产生的外部副作用（网络、日志、其他 signal 写入、被直接改写的旧 context）无法回滚。
  - `can()` 运行 guard，guard 抛出的异常会向调用方传播。
  - 订阅回调抛错发生在提交**之后**，不会撤销已提交状态。
- **重入**：guard / action 执行期间禁止再次 `send()`，抛 `Error("guard 和 action 执行期间不能再次发送事件")`；订阅回调中允许发送下一事件。
- **清理**：`destroy()` 幂等，释放全部订阅、取消排队通知、停止后续发送；此后 `send()` 返回最终快照、`can()` 返回 `false`、新增订阅不触发，`get()` / `matches()` 仍可读最终状态。外部创建的 `computed` / `effect` 由调用方清理，异步任务不会自动取消。
- **异步**：guard 与 action 必须同步返回；异步工作在机器外完成后再 `send()` 结果事件。

## 能力边界（逐项以源码为准）

| 能力                   | 是否提供 | 依据                                                                               |
| ---------------------- | -------- | ---------------------------------------------------------------------------------- |
| 层级（嵌套）状态       | 不提供   | `MachineStateConfig` 只有 `on`，`states` 是扁平 `Record<State, ...>`，无子状态配置 |
| 并行状态               | 不提供   | 当前状态是单个 `State` 字符串（`MachineSnapshot.value`）                           |
| 计时器 / 延迟转换      | 不提供   | 配置无 `after` / `delay` / `timeout` 字段，`send()` 完全同步                       |
| actor / invoke / spawn | 不提供   | 配置与实现中无 actor / invoke 相关字段                                             |
| 异步转换               | 不提供   | `MachineGuard` / `MachineAction` 是同步函数类型，`send()` 同步返回快照             |
| entry / exit action    | 不提供   | `actions` 只挂在 `MachineTransition` 上，状态配置无 `entry` / `exit`               |
| `assign` 等内部 helper | 不提供   | `actions` 仅是 `(context, event) => Context \| void` 普通函数                      |

## 自动导入

`createAutoImportApis(prefix?)` 返回 `unplugin-auto-import` 的 `ImportsMap`。登记清单以 `src/auto-import-api.ts` 的 `allImportApis` 为准，当前只有 `createMachine`，来源名为 `@slux/state-machine`（`createAutoImportApis` 本身不登记）。

```ts
import AutoImport from "unplugin-auto-import/vite";
import { createAutoImportApis } from "@slux/state-machine";

export default {
  plugins: [AutoImport({ imports: [createAutoImportApis()] })],
};
```

默认无前缀；传入**以小写字母结尾**的前缀时，别名会把 API 名首字母大写（如 `createAutoImportApis("u")` → `uCreateMachine`）。大小写规则由 `@slux/shared` 的 `generateBatchAutoImports` / `createAutoImports` 决定。

## 类型导出

以 `src/index.ts` 的 `export type` 为准，共 8 个：

| 类型                                             | 用途                                                                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `MachineSnapshot<Context, State>`                | `{ readonly value: State; readonly context: Context }`                                                |
| `MachineGuard<Context, Event>`                   | `(context, event) => boolean`                                                                         |
| `MachineAction<Context, Event>`                  | `(context, event) => Context \| void`                                                                 |
| `MachineTransition<Context, Event, State>`       | `{ target?; guard?; actions? }` 转换对象                                                              |
| `MachineTransitionConfig<Context, Event, State>` | `State \| MachineTransition`（字符串简写或对象）                                                      |
| `MachineStateConfig<Context, Event, State>`      | 单个状态的 `on` 事件表                                                                                |
| `MachineConfig<Context, Event, State>`           | `{ initial; context; states }` 顶层配置                                                               |
| `StateMachine<Context, Event, State>`            | `createMachine` 返回类型：`Subscribable<MachineSnapshot>` 加上 `send` / `matches` / `can` / `destroy` |

## 不适用的场景 / 与其他包分工

- 与 `@slux/core`：core 提供响应式运行时；本包只叠加离散状态 + 转换表范式层。
- 与 `@slux/flux`：flux 是「任意结构 reducer 状态 + dispatch 管道中间件」；本包是「离散状态 + 创建时校验的转换表 + guard / action」。不提供的能力逐项见「能力边界」。
- 框架绑定只读本实例、写入仍走 `send(event)` 等通用约定见仓库根 [README.md](../../README.md) 的「框架适配 · 通用约定」一节。

## 版本、许可与反馈

- 版本：`0.1.0`（`package.json`）。
- 许可：MIT，见仓库根 [LICENSE](../../LICENSE)。
- 问题反馈：`https://github.com/itmanyong/slux/issues`（`package.json` `bugs.url`）。
