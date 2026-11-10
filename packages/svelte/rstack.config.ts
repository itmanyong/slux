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
  tools: {
    rspack: {
      module: {
        rules: [
          {
            test: /\.svelte$/,
            use: [fileURLToPath(new URL("./__tests__/svelte-loader.mjs", import.meta.url))],
          },
        ],
      },
    },
  },
});
define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);
