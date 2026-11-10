import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "./demos";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("页面缺少 #root 容器");

createExamplePage(root, {
  branding: {
    pkg: "/angular",
    kicker: "Framework layer · Angular 绑定",
    titleHtml: `把 slux 状态，<em>接进 Angular 注入</em>`,
    descriptionHtml: `${demos.length} 个示例覆盖 <code>@slux/angular</code> 的 7 个子入口。
      每张卡片挂载的是一个真实 Angular 组件，「源码」面板展示的就是驱动它的最小实现。`,
    colophon: "@slux/angular · angular 22 · rspack",
  },
  groups,
  demos,
});
