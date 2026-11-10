import "./index.css";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "./demos";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("页面缺少 #root 容器");

createExamplePage(root, {
  branding: {
    pkg: "/shared",
    kicker: "Internal layer · 共享工具",
    titleHtml: `把共享工具，<em>放进真实场景</em>`,
    descriptionHtml: `${demos.length} 个示例覆盖 <code>@slux/shared</code> 的 runAll 批量执行与 createAutoImports / generateBatchAutoImports 配置生成。
      每张卡片由声明式 readouts/actions 驱动，「源码」面板展示的就是驱动它的最小实现。`,
    colophon: "@slux/shared · runAll · rsbuild",
  },
  groups,
  demos,
});
