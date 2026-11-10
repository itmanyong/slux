import { define } from "rstack";
import { sharedTestConfig } from "../../rstack.test.config";

define.extends([sharedTestConfig]);
define.test({
  testEnvironment: "jsdom",
});

define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);

define.app({
  html: {
    title: "slux tab-sync · 示例",
    template: "./src/index.html",
    favicon: "./public/favicon.svg",
    meta: {
      description:
        "以瀑布流卡片演示 @slux/tab-sync：BroadcastChannel 把 @slux/store 的状态同步到同源页签，支持字段过滤、冲突策略与通道生命周期管理。",
      viewport: "width=device-width, initial-scale=1",
      "theme-color": "#ffffff",
    },
  },
});
