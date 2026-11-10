import type { RstackConfig } from "rstack";

const isTaskDev = process.env["UNO_ORCHESTRATION_ENV"] === "dev";
const isWatch = process.argv.includes("-w") || process.argv.includes("--watch");

const isBundle = true;

export const sharedLibConfig: RstackConfig = {
  lib: {
    source: {
      tsconfigPath: "./tsconfig.build.json",
      entry: {
        index: isBundle ? "./src/index.ts" : ["./src/**/*.ts"],
      },
    },
    lib: (["esm", "cjs"] as const).map((format) => ({
      format,
      bundle: isBundle,
      dts: {
        tsgo: !isTaskDev,
        bundle: isBundle,
        autoExtension: true,
        isolated: isTaskDev && !isBundle,
        distPath: "./dist",
      },
    })),
    output: {
      // 并行 watch 启动时，依赖包仍需要读取上一轮构建的产物和类型声明。
      cleanDistPath: !isWatch,
      target: "web",
      distPath: { root: "./dist" },
      sourceMap: true,
      minify: {
        jsOptions: {
          minimizerOptions: {
            mangle: isBundle,
            minify: isBundle,
            compress: isBundle,
          },
        },
      },
    },
  },
};
