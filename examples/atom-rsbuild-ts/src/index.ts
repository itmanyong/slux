import "./index.css";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "./demos";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("页面缺少 #root 容器");

createExamplePage(root, {
  branding: {
    pkg: "/atom",
    kicker: "Primitive layer · 原子状态范式",
    titleHtml: `把状态拆成原子，<em>让依赖自己连起来</em>`,
    descriptionHtml: `${demos.length} 个示例覆盖 <code>@slux/atom</code> 的五个核心 API：atom、derived、writableAtom、atomFactory 与 createAtomScope。每张卡片运行的就是源码面板里的最小复现。`,
    colophon: "@slux/atom · vanilla TS · rsbuild",
  },
  groups,
  demos,
});
