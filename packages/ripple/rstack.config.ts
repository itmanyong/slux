import { define } from "rstack";
import { fileURLToPath } from "node:url";
import { sharedLibConfig } from "../../rstack.lib.config";
import { sharedTestConfig } from "../../rstack.test.config";

define.extends([
  {
    ...sharedLibConfig,
    lib: {
      ...sharedLibConfig.lib,
      lib: [
        {
          format: "esm",
          bundle: true,
          dts: { tsgo: true, bundle: true, autoExtension: true },
        },
      ],
    },
  },
  sharedTestConfig,
]);
define.lib({
  source: {
    entry: {
      index: "./src/index.ts",
      root: "./src/root.ts",
      server: "./src/server.ts",
      atom: "./src/atom.ts",
      store: "./src/store.ts",
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
      include: ["__tests__/bindings.test.ts"],
      testEnvironment: "jsdom",
      resolve: {
        conditionNames: ["browser", "import", "default"],
        alias: {
          "@slux/ripple$": fileURLToPath(new URL("./src/index.ts", import.meta.url)),
        },
      },
      tools: {
        rspack: {
          module: {
            rules: [
              {
                test: /\.fixture\.tsx$/,
                enforce: "pre",
                use: [
                  {
                    loader: fileURLToPath(new URL("./__tests__/compiler-loader.mjs", import.meta.url)),
                    options: { mode: "client" },
                  },
                ],
              },
            ],
          },
        },
      },
    },
    {
      name: "server",
      include: ["__tests__/server.test.ts"],
      testEnvironment: "node",
      resolve: {
        alias: {
          "@slux/ripple$": fileURLToPath(new URL("./src/server.ts", import.meta.url)),
        },
      },
      tools: {
        rspack: {
          module: {
            rules: [
              {
                test: /\.fixture\.tsx$/,
                enforce: "pre",
                use: [
                  {
                    loader: fileURLToPath(new URL("./__tests__/compiler-loader.mjs", import.meta.url)),
                    options: { mode: "server" },
                  },
                ],
              },
            ],
          },
        },
      },
    },
  ],
});
define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);
