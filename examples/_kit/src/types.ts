/**
 * 示例契约：与框架、UI 实现无关。
 *
 * 一个示例 = 一个交互演示文件 + 一个同名 `.repro.ts` 最小复现片段：
 * - 演示文件只使用被演示的库 API 与上下文回调（log），不含任何 DOM、样式或框架代码，
 *   因此同一份逻辑可以被任意框架示例复用，用来验证跨框架行为一致；
 * - 复现片段只含 slux API 调用与 console.log，由 `__tests__/repro.test.ts`
 *   真实运行并逐行比对输出，示例应用通过 `?raw` 将它作为「源码」面板展示。
 */

/** 左侧菜单的分组键，与 `@slux/core` 的公开 API 一一对应。 */
export type DemoApiId = "signal" | "computed" | "effect" | "batch" | "scope";

/** 运行日志的语气，决定前端着色与统计分类。 */
export type LogTone = "write" | "notify" | "effect" | "compute" | "scope" | "error" | "info";

export interface DemoContext {
  /** 写入一条运行日志；tone 省略时按普通信息处理。 */
  log(message: string, tone?: LogTone): void;
}

export interface DemoFlowNode {
  label: string;
  value: string;
}

/**
 * 展示区的一个读数。每次操作后由 UI 重新调用 `read()`，
 * 因此示例不需要自带渲染逻辑，也不依赖任何框架的响应式系统。
 */
export type DemoReadout =
  | {
      kind: "metric";
      label: string;
      hint?: string;
      emphasis?: boolean;
      read(): string;
    }
  | { kind: "text"; label: string; read(): string }
  | { kind: "list"; label: string; read(): readonly string[] }
  | { kind: "flow"; label: string; read(): readonly DemoFlowNode[] };

/** 操作按钮附带的行内输入框，用于演示「写入指定值」。 */
export interface DemoActionInput {
  kind?: "text" | "number";
  placeholder: string;
  value: string;
}

export interface DemoAction {
  id: string;
  label: string;
  title?: string;
  primary?: boolean;
  input?: DemoActionInput;
  /** 有 input 时 receive 输入框文本，否则收到空字符串。 */
  run(input: string): void;
}

export interface DemoInstance {
  readouts: readonly DemoReadout[];
  actions: readonly DemoAction[];
  /** 需要在操作之外自动刷新的示例（如基于订阅的被动更新）可提供该钩子。 */
  subscribe?(listener: () => void): () => void;
  dispose?(): void;
}

export interface DemoDefinition {
  /** 稳定 id，同时用于定位源码文件。 */
  id: string;
  api: DemoApiId;
  title: string;
  /** header 中的 API 标签，例如 `signal.set(recipe)`。 */
  apiLabel: string;
  summary: string;
  note?: string;
  create(context: DemoContext): DemoInstance;
}

/** 仅用于获得字面量类型推断，运行期原样返回。 */
export function defineDemo(definition: DemoDefinition): DemoDefinition {
  return definition;
}
