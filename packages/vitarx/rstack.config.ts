import { define } from "rstack";
import { sharedLibConfig } from "../../rstack.lib.config";
import { sharedTestConfig } from "../../rstack.test.config";

define.extends([sharedLibConfig, sharedTestConfig]);
define.lib({
  source: {
    entry: {
      index: "./src/index.ts",
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
  testEnvironment: "jsdom",
});
define.lint(({ js, ts }) => [js.configs.recommended, ts.configs.recommended]);
