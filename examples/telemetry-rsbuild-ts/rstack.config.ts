import { define } from "rstack";
import { sharedTestConfig } from "../../rstack.test.config";

define.extends([sharedTestConfig]);
define.test({
  testEnvironment: "jsdom",
});

define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);

define.app({
  html: {
    title: "slux telemetry · 示例",
    template: "./src/index.html",
    favicon: "./public/favicon.svg",
    meta: {
      description: "以瀑布流卡片演示 @slux/telemetry：把遥测中间件挂到 @slux/store，记录状态变化、订阅与初始化，支持字段过滤与运行时暂停。",
      viewport: "width=device-width, initial-scale=1",
      "theme-color": "#ffffff",
    },
  },
});
