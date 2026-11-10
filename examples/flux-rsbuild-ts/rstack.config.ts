import { define } from "rstack";
import { sharedTestConfig } from "../../rstack.test.config";

define.extends([sharedTestConfig]);
define.test({
  testEnvironment: "jsdom",
});
define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);

define.app({
  html: {
    title: "slux flux · 示例",
    template: "./src/index.html",
    favicon: "./public/favicon.svg",
    meta: {
      description: "通过独立交互实验，探索 @slux/flux 的 createFluxStore、dispatch、subscribe 与 middleware 等公开 API。",
      viewport: "width=device-width, initial-scale=1",
      "theme-color": "#ffffff",
    },
  },
});
