import { readdirSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
const releasesRoot = resolve(siteRoot, "../../releases");
const githubSourceBase = "https://github.com/itmanyong/slux/blob/main/";
const packageNames = readdirSync(resolve(docsRoot, "packages"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const exampleNames = readdirSync(resolve(siteRoot, "../../examples"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
  .map((entry) => entry.name);

const releaseFiles = readdirSync(releasesRoot)
  .filter((name) => /^v\d+\.\d+\.\d+(?:[-.][\w.-]+)?\.md$/.test(name))
  .sort((a, b) => b.localeCompare(a, "en", { numeric: true }));

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
    socialLinks: [
      {
        icon: "github",
        mode: "link",
        content: "https://github.com/itmanyong/slux",
      },
    ],
  },
  plugins: [
    readingTime({ defaultLocale: "zh-CN" }),
    mermaid(),
    pluginPreview(),
    pluginPlayground({ include: ["@slux/core"] }),
    {
      name: "remote-changelogs",
      async addPages() {
        return packageNames.map((name) => ({
          routePath: `/packages/${name}/changelog`,
          content: `---\ntitle: "@slux/${name} · 更新日志"\ndescription: "@slux/${name} 的远程更新日志。"\n---\n\nimport { RemoteMarkdown } from "@rspress/core/theme";\n\n<RemoteMarkdown path="packages/${name}/CHANGELOG.md" />`,
        }));
      },
    },
    {
      name: "remote-releases",
      async addPages() {
        const metaPath = resolve(docsRoot, "releases", "_meta.json");
        const sidebar = `${JSON.stringify(
          releaseFiles.map((file) => ({
            type: "custom-link",
            label: file,
            link: `/releases/${file.slice(0, -3)}`,
          })),
          null,
          2,
        )}\n`;
        await mkdir(resolve(docsRoot, "releases"), { recursive: true });
        const current = await readFile(metaPath, "utf8").catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
          return "";
        });
        if (current !== sidebar) await writeFile(metaPath, sidebar);

        const pages = releaseFiles.map((file) => ({
          routePath: `/releases/${file.slice(0, -3)}`,
          content: `---\ntitle: "${file.slice(0, -3)} · 更新日志"\ndescription: "slux ${file.slice(0, -3)} 版本的远程更新日志。"\n---\n\nimport { RemoteMarkdown } from "@rspress/core/theme";\n\n<RemoteMarkdown path="releases/${file}" />`,
        }));
        return [
          {
            routePath: "/releases/",
            content: releaseFiles.length
              ? `---\ntitle: "更新日志"\ndescription: "slux 的版本更新记录。"\n---\n\nimport { RemoteMarkdown } from "@rspress/core/theme";\n\n<RemoteMarkdown path="releases/${releaseFiles[0]}" />`
              : `---\ntitle: "更新日志"\ndescription: "slux 的版本更新记录。"\n---\n\n# 更新日志\n\n暂无版本记录。`,
          },
          ...pages,
        ];
      },
    },
    {
      name: "package-readmes",
      async addPages() {
        return Promise.all(
          packageNames.map(async (name) => {
            const readme = await readFile(resolve(packagesRoot, name, "README.md"), "utf8");
            const sourceUrl = new URL(`packages/${name}/README.md`, githubSourceBase);
            const linkedReadme = readme
              .replace(/^<!-- package-navigation:(?:start|end) -->\r?\n/gm, "")
              .replace(/\]\(((?:\.\/|\.\.\/)[^)]+)\)/g, (_, target: string) => `](${new URL(target, sourceUrl)})`);

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
import { ExampleFrame } from "@rspress/core/theme";

# 演示示例

下方展示 @slux/${name} 在独立项目中的运行效果。你可以直接体验，也可以查看项目源码或在新标签页打开完整页面。

<ExampleFrame title="@slux/${name} 交互演示" src={normalizeImagePath("/examples/${example}/")} sourcePath="examples/${example}" />
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
import { ExampleFrame } from "@rspress/core/theme";

# @slux/${name} 示例

下方展示 @slux/${name} 在独立项目中的运行效果。你可以直接体验，也可以查看项目源码或在新标签页打开完整页面。

<ExampleFrame title="@slux/${name} 交互示例" src={normalizeImagePath("/examples/${example}/")} sourcePath="examples/${example}" />
`,
          };
        });

        return [...referencePages, ...demoPages, ...examplePages];
      },
    },
  ],
});
