import { fileURLToPath } from "node:url";
import { define } from "rstack";
import { sharedLibConfig } from "../../rstack.lib.config";
import { sharedTestConfig } from "../../rstack.test.config";

define.extends([sharedLibConfig, sharedTestConfig]);
define.lib({
  source: {
    entry: {
      index: "./src/index.ts",
      store: "./src/store.ts",
      atom: "./src/atom.ts",
      proxy: "./src/proxy.ts",
      flux: "./src/flux.ts",
      "state-machine": "./src/state-machine.ts",
      rxjs: "./src/rxjs.ts",
    },
  },
});
define.test({
  projects: [
    {
      name: "client",
      testEnvironment: "jsdom",
      include: ["__tests__/client.test.ts", "__tests__/paradigms.client.test.ts"],
      resolve: {
        alias: {
          "solid-js$": fileURLToPath(new URL("./node_modules/solid-js/dist/solid.js", import.meta.url)),
          "solid-js/web$": fileURLToPath(new URL("./node_modules/solid-js/web/dist/web.js", import.meta.url)),
        },
      },
    },
    {
      name: "server",
      testEnvironment: "node",
      include: ["__tests__/server.test.ts", "__tests__/paradigms.server.test.ts"],
    },
  ],
});
define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);
