import { define } from "rstack";
import { sharedTestConfig } from "../../rstack.test.config";

define.extends([sharedTestConfig]);
define.test({
  testEnvironment: "jsdom",
});

define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);

define.app({
  html: {
    title: "slux rxjs · 示例",
    template: "./src/index.html",
    favicon: "./public/favicon.svg",
    meta: {
      description: "以瀑布流卡片演示 @slux/rxjs 的 toObservable 与 fromObservable 双向桥接，全部由声明式 readouts/actions 驱动。",
      viewport: "width=device-width, initial-scale=1",
      "theme-color": "#ffffff",
    },
  },
});
