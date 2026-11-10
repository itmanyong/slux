import "./index.css";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "./demos";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("页面缺少 #root 容器");

createExamplePage(root, {
  branding: {
    pkg: "/state-machine",
    kicker: "Primitive layer · 有限状态机",
    titleHtml: `把流程规则，<em>收敛进状态机</em>`,
    descriptionHtml: `${demos.length} 个示例覆盖 <code>@slux/state-machine</code> 的事件流转、guard 守卫与 context 动作。
      每张卡片由声明式 readouts/actions 驱动，「源码」面板展示的就是驱动它的最小实现。`,
    colophon: "@slux/state-machine · createMachine · rsbuild",
  },
  groups,
  demos,
});
