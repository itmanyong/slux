/**
 * 最小复现登记表：构建期通过 ?raw 读取示例层同名 .repro.ts 片段文件，
 * 卡片「源码」面板展示的是开发者可搬进自己项目复现该效果的最小 API 用法，
 * 而非示例的脚手架实现。片段由 _kit 的 repro 测试真实运行并逐行比对输出。
 * 新增示例后需要在 demos/ 旁补一个同名 .repro.ts，再重新生成此表。
 */

import source0 from "@slux/kit-example/demos/batch/merge.repro.ts?raw";
import source1 from "@slux/kit-example/demos/batch/nested.repro.ts?raw";
import source2 from "@slux/kit-example/demos/batch/not-transaction.repro.ts?raw";
import source3 from "@slux/kit-example/demos/computed/circular.repro.ts?raw";
import source4 from "@slux/kit-example/demos/computed/dynamic-deps.repro.ts?raw";
import source5 from "@slux/kit-example/demos/computed/equals-skip.repro.ts?raw";
import source6 from "@slux/kit-example/demos/computed/lazy-cache.repro.ts?raw";
import source7 from "@slux/kit-example/demos/effect/cleanup.repro.ts?raw";
import source8 from "@slux/kit-example/demos/effect/error-aggregate.repro.ts?raw";
import source9 from "@slux/kit-example/demos/effect/sync-run.repro.ts?raw";
import source10 from "@slux/kit-example/demos/effect/untracked-read.repro.ts?raw";
import source11 from "@slux/kit-example/demos/scope/fork.repro.ts?raw";
import source12 from "@slux/kit-example/demos/scope/isolation.repro.ts?raw";
import source13 from "@slux/kit-example/demos/scope/override.repro.ts?raw";
import source14 from "@slux/kit-example/demos/scope/serialize.repro.ts?raw";
import source15 from "@slux/kit-example/demos/signal/basic-write.repro.ts?raw";
import source16 from "@slux/kit-example/demos/signal/collections.repro.ts?raw";
import source17 from "@slux/kit-example/demos/signal/custom-equals.repro.ts?raw";
import source18 from "@slux/kit-example/demos/signal/draft-immutable.repro.ts?raw";
import source19 from "@slux/kit-example/demos/signal/special-values.repro.ts?raw";
import source20 from "@slux/kit-example/demos/signal/subscribe-lifecycle.repro.ts?raw";

export interface DemoSource {
  /** 片段文件在仓库中的真实路径 */
  path: string;
  code: string;
}

export const demoSources: Record<string, DemoSource> = {
  "batch-merge": {
    path: "examples/_kit/src/demos/batch/merge.repro.ts",
    code: source0,
  },
  "batch-nested": {
    path: "examples/_kit/src/demos/batch/nested.repro.ts",
    code: source1,
  },
  "batch-not-transaction": {
    path: "examples/_kit/src/demos/batch/not-transaction.repro.ts",
    code: source2,
  },
  "computed-cycle": {
    path: "examples/_kit/src/demos/computed/circular.repro.ts",
    code: source3,
  },
  "computed-dynamic": {
    path: "examples/_kit/src/demos/computed/dynamic-deps.repro.ts",
    code: source4,
  },
  "computed-equals": {
    path: "examples/_kit/src/demos/computed/equals-skip.repro.ts",
    code: source5,
  },
  "computed-lazy": {
    path: "examples/_kit/src/demos/computed/lazy-cache.repro.ts",
    code: source6,
  },
  "effect-cleanup": {
    path: "examples/_kit/src/demos/effect/cleanup.repro.ts",
    code: source7,
  },
  "effect-error": {
    path: "examples/_kit/src/demos/effect/error-aggregate.repro.ts",
    code: source8,
  },
  "effect-sync": {
    path: "examples/_kit/src/demos/effect/sync-run.repro.ts",
    code: source9,
  },
  "effect-untracked": {
    path: "examples/_kit/src/demos/effect/untracked-read.repro.ts",
    code: source10,
  },
  "scope-fork": {
    path: "examples/_kit/src/demos/scope/fork.repro.ts",
    code: source11,
  },
  "scope-isolation": {
    path: "examples/_kit/src/demos/scope/isolation.repro.ts",
    code: source12,
  },
  "scope-override": {
    path: "examples/_kit/src/demos/scope/override.repro.ts",
    code: source13,
  },
  "scope-serialize": {
    path: "examples/_kit/src/demos/scope/serialize.repro.ts",
    code: source14,
  },
  "signal-basic-write": {
    path: "examples/_kit/src/demos/signal/basic-write.repro.ts",
    code: source15,
  },
  "signal-collections": {
    path: "examples/_kit/src/demos/signal/collections.repro.ts",
    code: source16,
  },
  "signal-equals": {
    path: "examples/_kit/src/demos/signal/custom-equals.repro.ts",
    code: source17,
  },
  "signal-draft": {
    path: "examples/_kit/src/demos/signal/draft-immutable.repro.ts",
    code: source18,
  },
  "signal-special-values": {
    path: "examples/_kit/src/demos/signal/special-values.repro.ts",
    code: source19,
  },
  "signal-subscribe": {
    path: "examples/_kit/src/demos/signal/subscribe-lifecycle.repro.ts",
    code: source20,
  },
};
