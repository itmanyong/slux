import "./index.css";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "./demos";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("页面缺少 #root 容器");

createExamplePage(root, {
  branding: {
    pkg: "/tab-sync",
    kicker: "Middleware layer · 跨页签同步",
    titleHtml: `让多个页签，<em>共享一份状态</em>`,
    descriptionHtml: `${demos.length} 个示例演示 <code>@slux/tab-sync</code> 用 <code>BroadcastChannel</code> 同步 <code>@slux/store</code>：同页双实例对发、字段过滤、冲突合并与通道生命周期。当前环境缺少 BroadcastChannel 时，卡片会提示降级。`,
    colophon: "@slux/tab-sync · BroadcastChannel · rsbuild",
  },
  groups,
  demos,
});
