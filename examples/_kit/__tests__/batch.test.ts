import { describe, expect, it } from "rstack/test";
import { mount } from "./harness";

describe("batch 示例", () => {
  it("批内多次写入只刷新一次", () => {
    const demo = mount("batch-merge");
    expect(demo.read("effect 次数")).toBe("1");
    expect(demo.read("通知次数")).toBe("0");

    demo.action("plain");
    expect(demo.read("count")).toBe("3");
    expect(demo.read("通知次数")).toBe("3");
    expect(demo.read("effect 次数")).toBe("4");

    demo.action("batched");
    expect(demo.read("count")).toBe("6");
    expect(demo.read("通知次数")).toBe("4");
    expect(demo.read("effect 次数")).toBe("5");
  });

  it("嵌套批处理只在外层结束刷新，并返回回调结果", () => {
    const demo = mount("batch-nested");
    demo.action("nested");
    expect(demo.read("count")).toBe("11");
    expect(demo.read("effect 次数")).toBe("2");
    expect(demo.read("batch 返回值")).toBe("22");
    expect(demo.messages()).toContain("内层写入 1，内层结束时没有刷新");
  });

  it("批处理不回滚已提交的写入", () => {
    const demo = mount("batch-not-transaction");
    demo.action("throw");
    expect(demo.read("count")).toBe("11");
    expect(demo.read("effect 次数")).toBe("2");
    expect(demo.read("最近一次错误")).toBe("回调中途失败");
  });
});
