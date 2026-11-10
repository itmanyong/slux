import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { define } from "rstack";
import { pluginPlayground } from "@rspress/plugin-playground";
import { pluginPreview } from "@rspress/plugin-preview";
import mermaid from "rspress-plugin-mermaid";
import readingTime from "rspress-plugin-reading-time";
import { renderApiPages } from "./api-reference";

const siteRoot = import.meta.dirname;
const docsRoot = resolve(siteRoot, "docs");
const packagesRoot = resolve(siteRoot, "../../packages");
const githubSourceBase = "https://github.com/itmanyong/slux/blob/main/";
const packageNames = readdirSync(resolve(docsRoot, "packages"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const exampleNames = readdirSync(resolve(siteRoot, "../../examples"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
  .map((entry) => entry.name);

const exampleActions = (example: string) => `<div className="example-actions">
  <a className="example-action" href="https://github.com/itmanyong/slux/tree/main/examples/${example}" target="_blank" rel="noopener noreferrer">在Github中打开</a>
  <a className="example-action example-action--primary" href={normalizeImagePath("/examples/${example}/")} target="_blank" rel="noopener noreferrer">在新标签页打开</a>
</div>`;

define.doc({
  root: docsRoot,
  title: "slux",
  description: "框架无关的响应式状态管理工具与框架绑定",
  lang: "zh",
  base: "/slux/",
  logo: "/logo.svg",
  logoText: "slux",
  icon: "/favicon.svg",
  themeConfig: {
    socialLinks: [{ icon: "github", mode: "link", content: "https://github.com/itmanyong/slux" }],
  },
  plugins: [
    readingTime({ defaultLocale: "zh-CN" }),
    mermaid(),
    pluginPreview(),
    pluginPlayground({ include: ["@slux/core"] }),
    {
      name: "package-readmes",
      async addPages() {
        return Promise.all(
          packageNames.map(async (name) => {
            const readme = await readFile(resolve(packagesRoot, name, "README.md"), "utf8");
            const sourceUrl = new URL(`packages/${name}/README.md`, githubSourceBase);
            const linkedReadme = readme.replace(/\]\(((?:\.\/|\.\.\/)[^)]+)\)/g, (_, target: string) => `](${new URL(target, sourceUrl)})`);

            return {
              routePath: `/packages/${name}/readme`,
              content: `---\ntitle: "@slux/${name} · README 原文"\ndescription: "@slux/${name} 的包目录 README。"\n---\n\n${linkedReadme}`,
            };
          }),
        );
      },
    },
    {
      name: "package-api-and-demos",
      async addPages() {
        const referencePages = await renderApiPages(packageNames, packagesRoot);
        const examples = packageNames.map((name) => {
          const example = exampleNames.find((candidate) => candidate.startsWith(`${name}-`));
          if (!example) throw new Error(`@slux/${name} 缺少对应示例项目`);
          return { name, example };
        });

        const demoPages = examples.map(({ name, example }) => {
          return {
            routePath: `/packages/${name}/demo`,
            content: `---
title: "@slux/${name} · 演示示例"
description: "在文档站内运行 @slux/${name} 的独立示例项目。"
---

import { normalizeImagePath } from "@rspress/core/runtime";

# 演示示例

下方展示 @slux/${name} 在独立项目中的运行效果。你可以直接体验，也可以查看项目源码或在新标签页打开完整页面。

${exampleActions(example)}

<iframe className="package-demo-frame" title="@slux/${name} 交互演示" src={normalizeImagePath("/examples/${example}/")} loading="lazy" />
`,
          };
        });

        const examplePages = examples.map(({ name, example }) => {
          return {
            routePath: `/examples/${name}`,
            content: `---
title: "@slux/${name} · 示例"
description: "运行 @slux/${name} 的独立示例项目。"
---

import { normalizeImagePath } from "@rspress/core/runtime";

# @slux/${name} 示例

下方展示 @slux/${name} 在独立项目中的运行效果。你可以直接体验，也可以查看项目源码或在新标签页打开完整页面。

${exampleActions(example)}

<iframe className="package-demo-frame" title="@slux/${name} 交互示例" src={normalizeImagePath("/examples/${example}/")} loading="lazy" />
`,
          };
        });

        return [...referencePages, ...demoPages, ...examplePages];
      },
    },
  ],
});
