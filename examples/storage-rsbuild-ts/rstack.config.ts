import { define } from "rstack";
import { sharedTestConfig } from "../../rstack.test.config";

define.extends([sharedTestConfig]);
define.test({
  testEnvironment: "jsdom",
});

define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);

define.app({
  html: {
    title: "slux storage · 示例",
    template: "./src/index.html",
    favicon: "./public/favicon.svg",
    meta: {
      description:
        "以瀑布流卡片演示 @slux/storage 的 persist 中间件、memoryStorage 后端、partialize/merge、version/migrate 与 hydration 生命周期。",
      viewport: "width=device-width, initial-scale=1",
      "theme-color": "#ffffff",
    },
  },
});
