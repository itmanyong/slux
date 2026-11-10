# SPEC：slux 示例页统一规范（子 Agent 执行契约）

每个示例 = 一页「报头 + 左侧分组索引 + 瀑布流卡片 + 底部统计」的演示站。
页面外壳全部来自共享包 `@slux/shell-example`（`examples/_shell`），**不要复制外壳代码**。

标杆参考：`examples/react-rsbuild-ts`（已完成的试点，结构、文案、测试、README 全部以它为准）。

## 1. 外壳 API

```ts
import { createExamplePage } from "@slux/shell-example";
import type { ExampleDemo, ExampleGroup, LogTone } from "@slux/shell-example";

createExamplePage(rootElement, {
  branding: {
    pkg: "/react",                    // 品牌名后缀（顶栏 slux /react）
    kicker: "Framework layer · React 绑定",
    titleHtml: `把 slux 状态，<em>接进 React 渲染</em>`,
    descriptionHtml: `…<code>@slux/react</code>…`,   // 导语，可含 <code>
    colophon: "@slux/react · react 19 · rsbuild",
  },
  groups: readonly ExampleGroup[],    // { id, name, title, summary }
  demos: readonly ExampleDemo[],
});
```

`ExampleDemo`（两种内容形态二选一，`mount` 优先）：

```ts
{
  id: string; group: string;          // group = groups[].id
  title: string; apiLabel: string;    // apiLabel 如 "useSignal(source)" 或 "@slux/react/atom"
  summary: string; note?: string;
  repro: string;                      // ?raw 导入的最小复现源码
  reproPath: string;                  // 源码面板顶部路径，如 "src/demos/use-signal.tsx"
  mount?(container, ctx: { log(msg, tone?) }): void | (() => void);  // 框架组件挂载
  create?(ctx): { readouts, actions, subscribe?, dispose? };          // 纯 TS 声明式
}
```

- LogTone：`"write" | "notify" | "effect" | "compute" | "scope" | "info" | "error"`。
- `mount` 返回清理函数（如 `root.unmount()`）；组件状态用框架自身 API（`useState(() => …)` 等）创建，**重置卡片 = 卸载重挂 = 全新状态**。
- 声明式 `create` 用于无框架的纯 TS 示例（原语层）：readouts（metric/text/list/flow）+ actions（可带行内 input）。

## 2. 目录结构（rsbuild/rstack 系示例）

```
examples/<pkg>-rs/
  package.json          # scripts 不动；依赖见 §5
  rstack.config.ts      # 保留现有 plugins；html.title 改为 "slux <pkg> · 示例"，theme-color 改为 "#ffffff"
  tsconfig.json         # strict + noUncheckedIndexedAccess + noEmit（参照 react-rsbuild-ts）
  src/
    index.html          # 保留（#root）
    index.css           # @import fontsource…; @import "@slux/shell-example/styles.css"; @import "./demo.css";
    demo.css            # 框架演示组件的最小样式（参照 react-rsbuild-ts 的 .fd-* 类，可原样复制再改）
    index.ts            # createExamplePage(root, {...})，仅此一个职责
    env.d.ts            # declare "*.css" 与 "*?raw"
    demos/
      <demo-id>.tsx|.ts # 一个文件一个演示，自包含、最小化
      index.tsx|.ts     # groups + demos 注册表（含 ?raw repro 导入与 mount 适配）
  __tests__/page.test.tsx   # rstest
```

vite 系示例（actview-vite-ts / octane-vite-ts / ripple-vite-ts / viewfly-vite-ts / vitarx-vite-ts）：

- **保留** `vite.config.ts`（含关键 alias 与编译器插件）、根 `index.html`、vitest 测试方式；
- 只把 `src/` 与根 `index.html` 内容替换为新设计，`package.json` scripts 不动（build=vite build，test=vitest run）。
- 若这些示例没有 lint/fmt 脚本，跑 `npx prettier --check` 不作要求，以 build+test 通过为准。

## 3. 演示内容要求

- **5–8 个 demo**，按包的子入口/能力分组（groups 与子入口一一对应）。
  框架绑定包统一覆盖：useSignal（含 computed）、atom、store、proxy、flux、state-machine、rxjs（按包实际子入口取舍；不存在的入口跳过并注明）。
- demo 文件 = **最小复现**：自包含、只依赖被演示的包 + `@slux/shell-example` 的 LogTone 类型；文件内不写注释性废话；`?raw` 导入该文件作为 repro。
- 每个操作都通过 `ctx.log(msg, tone)` 留运行记录，读数（状态值）实时可见。
- 文案：中文，简洁技术风；标题动词开头（如「useSignal：信号驱动重渲染」）。
- 每个 demo 必须真实可用：不猜测 API，先读对应包的 `src/` 与 README 确认签名再写。

## 4. 测试要求（rstest，环境 jsdom）

`__tests__/page.test.tsx` 至少 4 条（参照 react-rsbuild-ts）：

1. 渲染全部卡片且内容区非空；
2. 某代表性 demo 交互后读数变化且产生日志；
3. 日志/源码 tabs 互斥 + 再点收起；
4. 一个有状态的 demo 的完整流转（如 machine 状态机）。
   测试环境注意：外壳已对 jsdom 缺失的 matchMedia/ResizeObserver 做降级。
   vite 系示例用 vitest（jsdom），断言同样标准，文件放 `__tests__/`（vitest 默认发现）。

## 5. 依赖（已由编排者统一写入 package.json，无需改动）

- 所有示例：`@slux/shell-example`（workspace）+ 三个 `@fontsource/*` devDeps。
- 框架示例：另含全部范式包 workspace 依赖（atom/store/proxy/flux/state-machine/rxjs）。
- **禁止**新增其他外部依赖；缺 API 就用现有依赖组合实现。若确需改动 package.json，完成后运行 `pnpm install` 并在报告中注明。

## 6. 验收清单（全部通过才算完成）

```
tsc --noEmit          # 或示例等效类型检查
rs test               # vitest 系为 pnpm test
rs lint               # 无 lint 脚本则跳过
rs fmt                # 无则跳过
rs build              # vite 系为 vite build
```

完成后在最终回复中报告：demo 清单（id/分组/一句话）、测试结果、build 产物大小、遇到的问题与取舍。

## 7. 视觉与文案基调

- 已定稿的 Chakra-teal 视觉全部由外壳提供，demo.css 只写演示组件自身（读数大数字用 `--font-mono`，按钮 `.fd-btn` / `.fd-btn.is-primary`）。
- 可用 CSS 变量见 `examples/_shell/src/styles/tokens.css`（--accent/--ink/--panel/--line/--radius-md/--font-mono 等）。
- 不修改 `_shell`、`core-rsbuild-ts`、`react-rsbuild-ts` 及其他示例目录——只动自己名下的目录。
