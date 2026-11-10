import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (name: string) => fileURLToPath(new URL(`../../packages/angular/src/${name}`, import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./__tests__/setup.ts"],
    alias: [
      // 测试直接跑 @slux/angular 源码：它的 dist 里带有 `~` 命名的外部 chunk，按 URL 加载会失败。
      { find: /^@slux\/angular$/, replacement: src("index.ts") },
      {
        find: /^@slux\/angular\/(atom|proxy|store|rxjs|flux|state-machine)$/,
        replacement: src("$1.ts"),
      },
    ],
  },
});
