import { define } from "rstack";
import { sharedTestConfig } from "../../rstack.test.config";

define.extends([sharedTestConfig]);
define.test({
  testEnvironment: "jsdom",
});
define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);

define.app({
  html: {
    title: "slux proxy · 示例",
    template: "./src/index.html",
    favicon: "./public/favicon.svg",
    meta: {
      description:
        "通过独立交互实验，探索 @slux/proxy 的 observable、snapshot 与 ref：把普通对象变成可观察的响应式数据，并安全地读取其不可变快照。",
      viewport: "width=device-width, initial-scale=1",
      "theme-color": "#ffffff",
    },
  },
});
