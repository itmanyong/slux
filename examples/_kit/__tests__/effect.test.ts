import { describe, expect, it } from "rstack/test";
import { mount } from "./harness";

describe("effect 示例", () => {
  it("首次同步执行，相同值不重跑", () => {
    const demo = mount("effect-sync");
    expect(demo.read("effect 运行次数")).toBe("1");

    demo.action("increment");
    expect(demo.read("count")).toBe("1");
    expect(demo.read("effect 运行次数")).toBe("2");

    demo.action("same");
    expect(demo.read("effect 运行次数")).toBe("2");

    demo.action("decrement");
    expect(demo.read("effect 运行次数")).toBe("3");
  });

  it("清理函数在重跑前与释放时执行", () => {
    const demo = mount("effect-cleanup");
    expect(demo.read("运行次数")).toBe("1");
    expect(demo.read("清理次数")).toBe("0");

    demo.action("increment");
    expect(demo.read("运行次数")).toBe("2");
    expect(demo.read("清理次数")).toBe("1");

    demo.action("dispose");
    expect(demo.read("状态")).toBe("已释放");
    expect(demo.read("清理次数")).toBe("2");

    demo.action("write-after");
    expect(demo.read("运行次数")).toBe("2");
    expect(demo.read("清理次数")).toBe("2");
  });

  it("清理函数中的读取不构成依赖", () => {
    const demo = mount("effect-untracked");
    expect(demo.read("effect 运行次数")).toBe("1");

    demo.action("bump-noise");
    expect(demo.read("noise")).toBe("1");
    expect(demo.read("effect 运行次数")).toBe("1");

    demo.action("flip-primary");
    expect(demo.read("effect 运行次数")).toBe("2");
  });

  it("多个 effect 的错误被汇总为 AggregateError", () => {
    const demo = mount("effect-error");
    demo.action("write");
    expect(demo.read("value")).toBe("1");
    expect(demo.read("捕获错误次数")).toBe("0");

    demo.action("write");
    expect(demo.read("value")).toBe("2");
    expect(demo.read("捕获错误次数")).toBe("1");
    expect(demo.read("最近一次错误")).toContain("AggregateError(2)");
    expect(demo.read("最近一次错误")).toContain("effect A 拒绝 2");
    expect(demo.read("最近一次错误")).toContain("effect B 拒绝 2");
  });
});
