import { fileURLToPath } from "node:url";
import { ripple } from "@ripple-ts/vite-plugin";
import { defineConfig } from "vitest/config";

const src = (name: string) => fileURLToPath(new URL(`../../packages/ripple/src/${name}`, import.meta.url));

// ripple 的 exports 在 Node 条件下解析到服务端运行时（没有 mount / effect 实现）。
// 浏览器构建会走 `browser` 条件，jsdom 测试需要同一份客户端运行时，这里显式指过去。
const rippleClient = fileURLToPath(new URL("./node_modules/ripple/src/runtime/index-client.js", import.meta.url));

export default defineConfig({
  plugins: [ripple({ ssr: false })],
  server: {
    host: true,
    port: 3000,
  },
  test: {
    environment: "jsdom",
    alias: [
      { find: /^ripple$/, replacement: rippleClient },
      // @slux/ripple 的 dist 由 Node 直接加载，它内部 import "ripple" 会拿到服务端运行时；
      // 测试跑源码，绑定层就与上面的客户端运行时共用同一份 ripple。
      { find: /^@slux\/ripple$/, replacement: src("index.ts") },
      { find: /^@slux\/ripple\/(atom|store|proxy)$/, replacement: src("$1.ts") },
    ],
  },
});
