import "./index.css";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "./demos";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("页面缺少 #root 容器");

createExamplePage(root, {
  branding: {
    pkg: "/telemetry",
    kicker: "Middleware layer · Store 遥测",
    titleHtml: `给状态变化，<em>装上记录仪</em>`,
    descriptionHtml: `${demos.length} 个示例覆盖 <code>@slux/telemetry</code> 的事件采集、字段过滤与运行时暂停。每张卡片把中间件挂进真实的 <code>@slux/store</code>，「源码」面板展示的就是驱动它的最小实现。`,
    colophon: "@slux/telemetry · store middleware · rsbuild",
  },
  groups,
  demos,
});
