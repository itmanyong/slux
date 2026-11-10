import "./index.css";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "./demos";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("页面缺少 #root 容器");

createExamplePage(root, {
  branding: {
    pkg: "/flux",
    kicker: "Primitive layer · reducer 与 dispatch 范式",
    titleHtml: `一次 dispatch，<em>一条单向数据流</em>`,
    descriptionHtml: `${demos.length} 个示例覆盖 <code>@slux/flux</code> 的 createFluxStore：reducer 整状态替换、subscribe 通知与 dispatch 中间件管道。每张卡片运行的就是源码面板里的最小复现。`,
    colophon: "@slux/flux · vanilla TS · rsbuild",
  },
  groups,
  demos,
});
