import { describe, expect, it } from "rstack/test";
import { mount } from "./harness";

describe("computed 示例", () => {
  it("惰性求值：写入不计算，读取才计算且命中缓存", () => {
    const demo = mount("computed-lazy");
    expect(demo.read("实际计算次数")).toBe("0");

    demo.action("read");
    expect(demo.read("实际计算次数")).toBe("1");
    expect(demo.read("最近一次读取结果")).toBe("2");

    demo.action("read");
    expect(demo.read("实际计算次数")).toBe("1");

    demo.action("read-thrice");
    expect(demo.read("实际计算次数")).toBe("1");

    demo.action("write");
    expect(demo.read("count")).toBe("2");
    expect(demo.read("实际计算次数")).toBe("1");

    demo.action("read");
    expect(demo.read("实际计算次数")).toBe("2");
    expect(demo.read("最近一次读取结果")).toBe("4");
  });

  it("动态依赖：只跟踪当前分支", () => {
    const demo = mount("computed-dynamic");
    demo.action("read");
    expect(demo.read("计算次数")).toBe("1");
    expect(demo.read("最近一次读取结果")).toBe("1");

    demo.action("bump-right");
    demo.action("read");
    expect(demo.read("计算次数")).toBe("1");

    demo.action("switch");
    demo.action("read");
    expect(demo.read("计算次数")).toBe("2");
    expect(demo.read("最近一次读取结果")).toBe("110");
    expect(demo.read("当前依赖")).toEqual(["branch", "right"]);

    demo.action("bump-left");
    demo.action("read");
    expect(demo.read("计算次数")).toBe("2");
  });

  it("派生结果相等时跳过下游", () => {
    const demo = mount("computed-equals");
    expect(demo.read("effect 运行次数")).toBe("1");
    expect(demo.read("effect 看到的奇偶")).toBe("偶数");

    demo.action("plus-one");
    expect(demo.read("effect 运行次数")).toBe("2");
    expect(demo.read("effect 看到的奇偶")).toBe("奇数");

    demo.action("plus-two");
    expect(demo.read("count")).toBe("3");
    expect(demo.read("computed 计算次数")).toBe("3");
    expect(demo.read("effect 运行次数")).toBe("2");
  });

  it("循环依赖在读取时抛出错误", () => {
    const demo = mount("computed-cycle");
    demo.action("read-a");
    expect(demo.read("读取结果")).toContain("循环依赖");
    expect(demo.read("捕获错误次数")).toBe("1");

    demo.action("read-b");
    expect(demo.read("捕获错误次数")).toBe("2");
  });
});
