import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createConfig } from "@nx/angular-rspack";
import type { RuleSetRule } from "@rspack/core";

const root = dirname(fileURLToPath(import.meta.url));

// 使用 Angular 官方的 Rspack 构建管线（@nx/angular-rspack）编译 Angular 组件。
export default async () => {
  const configs = await createConfig({
    options: {
      root,
      browser: "./src/main.ts",
      index: { input: "./src/index.html" },
      tsConfig: "./tsconfig.json",
      outputPath: "dist",
      assets: [{ glob: "**/*", input: "public" }],
      styles: ["./src/index.css"],
      polyfills: [],
      optimization: false,
      outputHashing: "none",
    },
  });

  // 内置 swc 规则按路径匹配所有 .ts，`?raw` 查询会被当成源码一起转译；
  // 让它们跳过 ?raw 模块，再补一条 asset/source 规则把 ?raw 作为原文导入。
  for (const config of configs) {
    // _shell 等源码包以 NodeNext 风格写 `./xxx.js` 导入，Angular 管线
    // 默认不做 .js → .ts 的别名映射，这里补上。
    config.resolve = {
      ...config.resolve,
      extensionAlias: {
        ".js": [".ts", ".js"],
        ".mjs": [".mts", ".mjs"],
        ".cjs": [".cts", ".cjs"],
      },
    };

    const rules = (config.module?.rules ?? []) as RuleSetRule[];
    for (const rule of rules) {
      const uses = rule?.use;
      const isSwcRule = Array.isArray(uses)
        ? uses.some((use) =>
            typeof use === "string"
              ? use.includes("swc-loader")
              : typeof use === "object" && use !== null && "loader" in use && use.loader.includes("swc-loader"),
          )
        : false;
      if (isSwcRule) rule.resourceQuery = { not: /raw/ };
    }
    rules.push({
      test: /\.ts$/,
      resourceQuery: /raw/,
      type: "asset/source",
    });
  }

  return configs;
};
