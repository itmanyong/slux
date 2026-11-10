import { define } from "rstack";
import { sharedTestConfig } from "../../rstack.test.config";

define.extends([sharedTestConfig]);
define.test({
  testEnvironment: "jsdom",
});

define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);

define.app({
  html: {
    title: "Slux Angular Playground · 信号接入 Angular",
    template: "./src/index.html",
    favicon: "./public/favicon.svg",
    meta: {
      description: "通过真实挂载的 Angular 组件，演示 @slux/angular 如何把 slux 信号接入 Angular 渲染。",
      viewport: "width=device-width, initial-scale=1",
      "theme-color": "#f8f9fb",
    },
  },
});
