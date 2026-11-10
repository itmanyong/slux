import { pluginPreact } from "@rsbuild/plugin-preact";
import { define } from "rstack";
import { sharedTestConfig } from "../../rstack.test.config";

define.extends([sharedTestConfig]);
define.test({
  testEnvironment: "jsdom",
});

define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);

define.app({
  plugins: [pluginPreact()],
  html: {
    title: "slux preact · 示例",
    template: "./src/index.html",
    favicon: "./public/favicon.svg",
    meta: {
      description: "以瀑布流卡片演示 @slux/preact 的 7 个子入口：useSignal、atom、store、proxy、flux、state-machine 与 rxjs 绑定。",
      viewport: "width=device-width, initial-scale=1",
      "theme-color": "#ffffff",
    },
  },
});
