import { define } from "rstack";
import { sharedTestConfig } from "../../rstack.test.config";

define.extends([sharedTestConfig]);
define.test({
  testEnvironment: "jsdom",
});
define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);

define.app({
  html: {
    title: "slux examples · 总览",
    template: "./src/index.html",
    favicon: "./public/favicon.svg",
    meta: {
      description:
        "集中展示 slux 全部示例：右上角统一浮层收起为下拉框、展开为分组列表，可拖拽切换示例；主区域以 iframe 全局渲染，主题与顶栏由总览统一接管。",
      viewport: "width=device-width, initial-scale=1",
      "theme-color": "#ffffff",
    },
  },
});
