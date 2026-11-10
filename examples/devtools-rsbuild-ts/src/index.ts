import "./index.css";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "./demos";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("页面缺少 #root 容器");

createExamplePage(root, {
  branding: {
    pkg: "/devtools",
    kicker: "Middleware layer · 可观测性",
    titleHtml: `让状态变化，<em>处处可观测</em>`,
    descriptionHtml: `${demos.length} 个示例覆盖 <code>@slux/devtools</code> 的 logger 中间件、inspect 全局检查器与 Redux DevTools 桥接。面板不可用的环境里，卡片直接展示中间件与检查器的 API 输出。`,
    colophon: "@slux/devtools · logger / inspect / devtools · rsbuild",
  },
  groups,
  demos,
});
