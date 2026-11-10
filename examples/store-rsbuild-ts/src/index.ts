import "./index.css";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "./demos";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("页面缺少 #root 容器");

createExamplePage(root, {
  branding: {
    pkg: "/store",
    kicker: "Primitive layer · 状态仓库",
    titleHtml: `把状态收敛成<em>一个可订阅的仓库</em>`,
    descriptionHtml: `${demos.length} 个示例覆盖 <code>@slux/store</code> 的 creator、setState、subscribe、middleware 与生命周期。
      每张卡片跑的是一个真实 store，「源码」面板展示驱动它的最小复现片段。`,
    colophon: "@slux/store · createStore · rsbuild",
  },
  groups,
  demos,
});
