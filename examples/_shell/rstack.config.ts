import { define } from "rstack";
import { sharedLibConfig } from "../../rstack.lib.config";
import { sharedTestConfig } from "../../rstack.test.config";

define.extends([sharedLibConfig, sharedTestConfig]);
define.lib({
  source: {
    entry: {
      index: "./src/index.ts",
      theme: "./src/theme.ts",
      styles: "./src/styles.ts",
    },
  },
});
define.test({
  testEnvironment: "jsdom",
});
define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);

define.app({
  html: {
    title: "slux core · 示例",
    template: "./src/index.html",
    favicon: "./public/favicon.svg",
    meta: {
      description: "以瀑布流卡片交互演示 @slux/core 的 7 个公开 API：signal、computed、effect、batch 与作用域。",
      viewport: "width=device-width, initial-scale=1",
      "theme-color": "#ffffff",
    },
  },
});
