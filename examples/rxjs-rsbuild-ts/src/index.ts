import "./index.css";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "./demos";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("页面缺少 #root 容器");

createExamplePage(root, {
  branding: {
    pkg: "/rxjs",
    kicker: "Bridge layer · RxJS 互通",
    titleHtml: `把 RxJS 流，<em>接进 slux 信号</em>`,
    descriptionHtml: `${demos.length} 个示例覆盖 <code>@slux/rxjs</code> 的 toObservable 与 fromObservable 双向桥接。
      每张卡片由声明式 readouts/actions 驱动，「源码」面板展示的就是驱动它的最小实现。`,
    colophon: "@slux/rxjs · rxjs 7 · rsbuild",
  },
  groups,
  demos,
});
