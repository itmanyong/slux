/**
 * 最小复现片段验证：卡片「源码」面板展示的每个 .repro.ts
 * 都在这里真实运行一遍，console 输出逐条与注释中的预期比对。
 * 任何一条失败都意味着展示给开发者的代码不再可信。
 */
import { describe, expect, it } from "rstack/test";

const normalize = (args: unknown[]): string =>
  args.map((arg) => (arg === undefined ? "undefined" : typeof arg === "string" ? arg : JSON.stringify(arg))).join(" ");

const capture = async (load: () => Promise<unknown>): Promise<string[]> => {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    lines.push(normalize(args));
  };
  try {
    await load();
  } finally {
    console.log = original;
  }
  return lines;
};

describe("最小复现片段", () => {
  it("signal/basic-write", async () => {
    const lines = await capture(async () => import("../src/demos/signal/basic-write.repro.js"));
    expect(lines).toEqual(["count = 10", "count = 11", "11"]);
  });

  it("signal/draft-immutable", async () => {
    const lines = await capture(async () => import("../src/demos/signal/draft-immutable.repro.js"));
    expect(lines).toEqual(["提交： Lin", "Lin", "Ada", "true", "提交： Grace"]);
  });

  it("signal/collections", async () => {
    const lines = await capture(async () => import("../src/demos/signal/collections.repro.js"));
    expect(lines).toEqual(["2", "1", "101", "core", "core,design"]);
  });

  it("signal/custom-equals", async () => {
    const lines = await capture(async () => import("../src/demos/signal/custom-equals.repro.js"));
    expect(lines).toEqual(["Ada", "true", "通知： Lin 2", "Lin"]);
  });

  it("signal/special-values", async () => {
    const lines = await capture(async () => import("../src/demos/signal/special-values.repro.js"));
    expect(lines).toEqual(["world", "undefined", "0", "2"]);
  });

  it("signal/subscribe-lifecycle", async () => {
    const lines = await capture(async () => import("../src/demos/signal/subscribe-lifecycle.repro.js"));
    expect(lines).toEqual(["回调收到 1", "回调收到 2"]);
  });

  it("computed/lazy-cache", async () => {
    const lines = await capture(async () => import("../src/demos/computed/lazy-cache.repro.js"));
    expect(lines).toEqual(["0", "4", "4", "4", "1"]);
  });

  it("computed/dynamic-deps", async () => {
    const lines = await capture(async () => import("../src/demos/computed/dynamic-deps.repro.js"));
    expect(lines).toEqual(["1", "1", "1", "1", "200", "2"]);
  });

  it("computed/equals-skip", async () => {
    const lines = await capture(async () => import("../src/demos/computed/equals-skip.repro.js"));
    expect(lines).toEqual(["effect 看到奇偶： 偶数", "effect 看到奇偶： 奇数", "2", "2", "3", "2"]);
  });

  it("computed/circular", async () => {
    const lines = await capture(async () => import("../src/demos/computed/circular.repro.js"));
    expect(lines).toEqual(["捕获： computed 存在循环依赖", "继续执行"]);
  });

  it("effect/sync-run", async () => {
    const lines = await capture(async () => import("../src/demos/effect/sync-run.repro.js"));
    expect(lines).toEqual([
      "第 1 次运行：读到 0",
      "创建完成时的运行次数： 1",
      "第 2 次运行：读到 1",
      "set 返回时的运行次数： 2",
      "相同值写入后的运行次数： 2",
    ]);
  });

  it("effect/cleanup", async () => {
    const lines = await capture(async () => import("../src/demos/effect/cleanup.repro.js"));
    expect(lines).toEqual(["运行 # 1 ： 0", "1 0", "清理 # 1 ：释放 0", "运行 # 2 ： 1", "2 1", "清理 # 2 ：释放 1", "2 2"]);
  });

  it("effect/untracked-read", async () => {
    const lines = await capture(async () => import("../src/demos/effect/untracked-read.repro.js"));
    expect(lines).toEqual(["运行 # 1 ：primary = A", "清理时 noise = 0", "运行 # 2 ：primary = B", "2", "2", "清理时 noise = 1"]);
  });

  it("effect/error-aggregate", async () => {
    const lines = await capture(async () => import("../src/demos/effect/error-aggregate.repro.js"));
    expect(lines).toEqual(["effect A 运行： 0", "effect B 运行： 0", '["effect A 拒绝","effect B 拒绝"]', "写入后的 value： 2"]);
  });

  it("batch/merge", async () => {
    const lines = await capture(async () => import("../src/demos/batch/merge.repro.js"));
    expect(lines).toEqual(["3 4", "5", "4 5"]);
  });

  it("batch/nested", async () => {
    const lines = await capture(async () => import("../src/demos/batch/nested.repro.js"));
    expect(lines).toEqual(["11", "1", "22"]);
  });

  it("batch/not-transaction", async () => {
    const lines = await capture(async () => import("../src/demos/batch/not-transaction.repro.js"));
    expect(lines).toEqual(["回调中途失败", "11", "1"]);
  });

  it("scope/override", async () => {
    const lines = await capture(async () => import("../src/demos/scope/override.repro.js"));
    expect(lines).toEqual(["作用域内 scope.get(count)： 10", "同一时刻 count.get()： 0", "0"]);
  });

  it("scope/fork", async () => {
    const lines = await capture(async () => import("../src/demos/scope/fork.repro.js"));
    expect(lines).toEqual(["dusk", "dusk", "solar", "dusk", "dusk"]);
  });

  it("scope/serialize", async () => {
    const lines = await capture(async () => import("../src/demos/scope/serialize.repro.js"));
    expect(lines).toEqual(['{"__scope_0":10}', '{"__scope_1":"child"}', '{"__scope_1":"child"}', '["__scope_1"]', '["__scope_1"]']);
  });

  it("scope/isolation", async () => {
    const lines = await capture(async () => import("../src/demos/scope/isolation.repro.js"));
    expect(lines).toEqual(["0", "99", "0", "1"]);
  });
});
