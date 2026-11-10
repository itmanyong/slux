import { fileURLToPath } from "node:url";
import vitarx from "@vitarx/plugin-vite";
import { defineConfig } from "vitest/config";

const src = (name: string) => fileURLToPath(new URL(`../../packages/vitarx/src/${name}`, import.meta.url));

export default defineConfig({
  plugins: [vitarx()],
  server: {
    host: true,
    port: 3000,
  },
  test: {
    environment: "jsdom",
    alias: [
      // 测试直接跑 @slux/vitarx 源码：它的 dist 里带有 `~` 命名的外部 chunk，jsdom 下按 URL 加载会失败。
      { find: /^@slux\/vitarx$/, replacement: src("index.ts") },
      { find: /^@slux\/vitarx\/(atom|store|proxy|flux|rxjs|state-machine)$/, replacement: src("$1.ts") },
    ],
  },
});
