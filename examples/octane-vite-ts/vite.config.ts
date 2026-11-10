import { octane } from "octane/compiler/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [octane({ ssr: false })],
  server: {
    host: true,
    port: 3000,
  },
  test: {
    environment: "jsdom",
  },
});
