import { actviewPlugin } from "@actview/plugin-vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [actviewPlugin()],
  server: {
    host: true,
    port: 3000,
  },
  test: {
    environment: "jsdom",
  },
});
