import "./index.css";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "./demos";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("页面缺少 #root 容器");

createExamplePage(root, {
  branding: {
    pkg: "/history",
    kicker: "Primitive layer · 撤销重做中间件",
    titleHtml: `给仓库装上<em>可穿越的时间线</em>`,
    descriptionHtml: `${demos.length} 个示例覆盖 <code>@slux/history</code> 的 undo/redo、redo 分支、maxDepth、clear 与 canUndo/canRedo 信号。
      中间件以 <code>middleware: [history()]</code> 挂进 <code>@slux/store</code>，卡片里跑的是真实时间旅行。`,
    colophon: "@slux/history · store middleware · rsbuild",
  },
  groups,
  demos,
});
