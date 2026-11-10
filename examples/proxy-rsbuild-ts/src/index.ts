import "./index.css";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "./demos";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("页面缺少 #root 容器");

createExamplePage(root, {
  branding: {
    pkg: "/proxy",
    kicker: "Primitive layer · 可变对象范式",
    titleHtml: `直接改对象，<em>让代理替你广播</em>`,
    descriptionHtml: `${demos.length} 个示例覆盖 <code>@slux/proxy</code> 的 observable、snapshot、observe 与 ref：写入走代理，读取拿快照。每张卡片运行的就是源码面板里的最小复现。`,
    colophon: "@slux/proxy · vanilla TS · rsbuild",
  },
  groups,
  demos,
});
