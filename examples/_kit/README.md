# @slux/kit-example

🧪 示例共享层：与框架无关的演示契约、`@slux/core` 的示例逻辑与 API 分组元数据。各示例应用只实现布局与 DOM 绑定，逻辑一律从这里引入，因此同一份原语在不同框架示例中的行为可以直接对照。

`pnpm --filter @slux/kit-example build` 产出 `dist` 中的运行时代码与类型声明；`./demos/*` 子路径保留源码导出，供示例应用通过 `?raw` 展示原始最小复现片段。

## 为什么单独一层

- 💡 **一份逻辑，多处复用**：核心层、范式层、中间件层与各框架示例共用同一批示例，避免同一行为在不同示例里写出差异。
- **最小复现片段**：每个示例旁有一份同名 `.repro.ts`——开发者搬进自己项目即可复现同款效果的最小 API 用法。示例应用通过 `?raw` 读取该片段用于「源码」面板，展示内容是一份真实文件。
- **可测试**：示例不依赖 DOM，测试直接驱动 `actions` 并断言 `readouts` 与日志；`.repro.ts` 片段则由 `repro.test.ts` 真实运行，`console` 输出逐条与注释中的预期比对。

## 契约

```ts
export interface DemoDefinition {
  id: string; // 稳定标识，同时用于按文件登记源码
  api: DemoApiId; // signal / computed / effect / batch / scope
  title: string;
  apiLabel: string; // 卡片 header 中的 API 标签
  summary: string;
  note?: string;
  create(context: DemoContext): DemoInstance;
}
```

💡 `create` 只做三件事：建立状态、订阅、返回实例。

```ts
export interface DemoInstance {
  readouts: readonly DemoReadout[]; // 每次操作后重新调用 read()，由 UI 决定怎么画
  actions: readonly DemoAction[]; // 按钮（可带行内输入框）
  subscribe?(listener: () => void): () => void; // 需要在操作之外自动刷新时提供
  dispose?(): void; // 释放订阅、effect 等资源
}
```

**读数**四种形态，UI 适配这些形态即可，示例本身不接触 DOM：

| 💡 kind  | 用途                       |
| -------- | -------------------------- |
| `metric` | 单个数值或短文本，可强调   |
| `text`   | 多行文本、JSON 快照        |
| `list`   | 标签列表（数组）           |
| `flow`   | 三段链路，如「全局→父→子」 |

**操作**通过 `context.log(message, tone?)` 记录运行轨迹，`tone` 取 `write` / `notify` / `effect` / `compute` / `scope` / `error` / `info`，UI 据此着色并统计。

## 目录

```
src/
  types.ts          契约定义
  catalog.ts        API 分组与公开 API 清单
  demos/
    signal/         6 个示例（+ 各自的 .repro.ts 最小复现片段）
    computed/       4 个示例
    effect/         4 个示例
    batch/          3 个示例
    scope/          4 个示例
    index.ts        展示顺序
__tests__/
  harness.ts        无 UI 装配：action 触发 + readout 读取
  repro.test.ts     运行全部 .repro.ts，断言注释中的预期输出
  signal|computed|effect|batch|scope.test.ts
```

## 最小复现片段（.repro.ts）

`.repro.ts` 与演示文件同名相邻（如 `basic-write.ts` ↔ `basic-write.repro.ts`），只包含：

- 🧪 文件首行一句 `// <卡片标题>：<apiLabel>`；
- 从 `@slux/core` 引入的最小 API 用法；
- 关键步骤之间用 `console.log` 输出，注释里逐行标注预期输出（`// → …`）。

规范：片段中不出现 `defineDemo`、`log()`、readouts 等脚手架概念；`unsubscribe` / `stop` 等收尾代码保留，因为它们本身是 API 语义的一部分；任何一条预期输出变了，都必须先在 `repro.test.ts` 里核实再改注释。

## 新增一个示例

1. 在 `src/demos/<分组>/` 新建文件，使用 `defineDemo` 导出一个示例，`id` 与文件名对应。
2. 在同目录新建同名 `.repro.ts` 最小复现片段，并在 `__tests__/repro.test.ts` 登记它的预期输出。
3. 在 `src/demos/index.ts` 的数组中加入它，位置决定展示顺序。
4. 在引用它的示例应用中重新生成源码登记表（如 `pnpm --filter @slux/example-core-rsbuild-ts gen:sources`）。
5. 在 `__tests__/` 补一条用例，断言关键读数和日志。

🚀 示例文件只使用被演示的库 API，不要引入 DOM、样式或框架代码；需要在卡片里展示的中间结果请放进 `readouts`。
