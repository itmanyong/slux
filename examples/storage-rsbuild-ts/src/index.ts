import "./index.css";
import { createExamplePage } from "@slux/shell-example";
import { demos, groups } from "./demos";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("页面缺少 #root 容器");

createExamplePage(root, {
  branding: {
    pkg: "/storage",
    kicker: "Primitive layer · 持久化中间件",
    titleHtml: `让仓库状态<em>落盘并读回来</em>`,
    descriptionHtml: `${demos.length} 个示例覆盖 <code>@slux/storage</code> 的 persist 中间件、StorageAdapter 后端、partialize/merge、version/migrate 与 hydration 生命周期。
      demo 全部使用包内 <code>memoryStorage</code>，真实 localStorage 行为在测试里用 jsdom 验证。`,
    colophon: "@slux/storage · persist · rsbuild",
  },
  groups,
  demos,
});
