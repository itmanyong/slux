/**
 * 示例页面外壳契约：与任何具体库、框架无关。
 *
 * 卡片支持两种内容形态（二选一，`mount` 优先）：
 * - `mount`：框架示例把真实框架组件挂进卡片内容区，返回清理函数（如 root.unmount）；
 * - `create`：纯 TS 示例沿用声明式契约（readouts / actions），外壳负责渲染与刷新。
 *
 * 每个示例自带 `repro`（构建期 `?raw` 导入的最小复现源码）与 `reproPath`，
 * 源码面板直接展示，无需任何登记脚本。
 */

/** 运行日志的语气，决定前端着色与底部统计分类。 */
export type LogTone = "write" | "notify" | "effect" | "compute" | "scope" | "error" | "info";

export interface DemoContext {
  /** 写入一条运行日志；tone 省略时按普通信息处理。 */
  log(message: string, tone?: LogTone): void;
}

/* ── 形态一：声明式（纯 TS 示例） ─────────────────────── */

export interface DemoFlowNode {
  label: string;
  value: string;
}

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
  /** 有 input 时收到输入框文本，否则收到空字符串。 */
  run(input: string): void;
}

export interface DemoInstance {
  readouts: readonly DemoReadout[];
  actions: readonly DemoAction[];
  /** 操作之外需要自动刷新的示例（订阅驱动的被动更新）可提供该钩子。 */
  subscribe?(listener: () => void): () => void;
  dispose?(): void;
}

/* ── 卡片定义 ─────────────────────────────────────────── */

export interface ExampleDemo {
  /** 稳定 id，同时用于 DOM 定位与测试。 */
  id: string;
  /** 所属分组 id，对应 ExampleGroup.id。 */
  group: string;
  title: string;
  /** header 中的 API 标签，例如 `useSignal(source)`。 */
  apiLabel: string;
  summary: string;
  note?: string;
  /** 源码面板展示的最小复现原文（`?raw` 导入）。 */
  repro: string;
  /** 源码面板顶部展示的路径。 */
  reproPath: string;
  /** 形态二：挂载框架组件，返回清理函数。 */
  mount?(container: HTMLElement, context: DemoContext): void | (() => void);
  /** 形态一：声明式契约。 */
  create?(context: DemoContext): DemoInstance;
}

export interface ExampleGroup {
  id: string;
  /** 左侧菜单与阶段标题中的短名，例如 `signal`。 */
  name: string;
  /** 阶段标题中的完整名，例如「信号与派生」。 */
  title: string;
  /** 选中该分组时显示的说明。 */
  summary: string;
}

export interface PageBranding {
  /** 品牌包名，例如 `@slux/react`。 */
  pkg: string;
  /** 报头 kicker 小签。 */
  kicker: string;
  /** 页面主标题，可含 `<em>` 强调。 */
  titleHtml: string;
  /** 导语段落，可含 `<code>`。 */
  descriptionHtml: string;
  /** 报头落款的等宽小字。 */
  colophon: string;
}

export interface ExamplePageOptions {
  branding: PageBranding;
  groups: readonly ExampleGroup[];
  demos: readonly ExampleDemo[];
}
