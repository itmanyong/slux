import { define } from "rstack";
import { sharedTestConfig } from "../../rstack.test.config";

define.extends([sharedTestConfig]);
define.test({
  testEnvironment: "jsdom",
});

define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);

define.app({
  // Inferno 的 JSX 由官方 swc 插件编译，产出 newVNode 调用而不是 createElement。
  tools: {
    swc: {
      jsc: {
        experimental: {
          plugins: [["swc-plugin-inferno", { pure: true }]],
        },
      },
    },
  },
  html: {
    title: "slux inferno · 示例",
    template: "./src/index.html",
    favicon: "./public/favicon.svg",
    meta: {
      description: "以瀑布流卡片演示 @slux/inferno 的 7 个子入口：SignalValue、atom、store、proxy、flux、state-machine 与 rxjs 绑定。",
      viewport: "width=device-width, initial-scale=1",
      "theme-color": "#ffffff",
    },
  },
});
