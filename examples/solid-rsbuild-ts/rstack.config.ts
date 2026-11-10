import { pluginBabel } from "@rsbuild/plugin-babel";
import { pluginSolid } from "@rsbuild/plugin-solid";
import { define } from "rstack";
import { sharedTestConfig } from "../../rstack.test.config";

// plugin-solid 只负责追加 babel-preset-solid 与 Solid 解析条件，JSX 仍需 plugin-babel 提供 babel loader。
define.extends([sharedTestConfig]);
define.test({
  testEnvironment: "jsdom",
});

define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);

define.app({
  plugins: [pluginBabel({ include: /\.(?:jsx|tsx)$/ }), pluginSolid()],
  html: {
    title: "slux solid · 示例",
    template: "./src/index.html",
    favicon: "./public/favicon.svg",
    meta: {
      description: "以瀑布流卡片演示 @slux/solid 的 7 个子入口：useSignal、atom、store、proxy、flux、state-machine 与 rxjs 绑定。",
      viewport: "width=device-width, initial-scale=1",
      "theme-color": "#ffffff",
    },
  },
});
