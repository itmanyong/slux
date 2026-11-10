import { describe, expect, it } from "rstack/test";
import { mount } from "./harness.js";

describe("signal 示例", () => {
  it("基础写入：订阅只在值变化时回调", () => {
    const demo = mount("signal-basic-write");
    expect(demo.read("count")).toBe("0");
    expect(demo.read("订阅回调次数")).toBe("0");

    demo.action("increment");
    expect(demo.read("count")).toBe("1");
    expect(demo.read("订阅回调次数")).toBe("1");

    demo.action("same");
    expect(demo.read("订阅回调次数")).toBe("1");

    demo.action("custom", "10");
    expect(demo.read("count")).toBe("10");
    expect(demo.read("订阅回调次数")).toBe("2");
  });

  it("草稿提交：旧快照不变且未修改分支共享引用", () => {
    const demo = mount("signal-draft");
    const initial = demo.read("初始快照（保持不变）");

    demo.action("edit");
    expect(demo.read("当前快照")).toBe("Lin / [reader, tag-1] / light");
    expect(demo.read("初始快照（保持不变）")).toBe(initial);
    expect(demo.read("preferences 分支复用")).toBe("是");
    expect(demo.read("提交次数")).toBe("1");

    demo.action("noop");
    expect(demo.read("提交次数")).toBe("1");

    demo.action("theme");
    expect(demo.read("preferences 分支复用")).toBe("否");
    expect(demo.read("提交次数")).toBe("2");

    demo.action("replace");
    expect(demo.read("当前快照")).toBe("Grace / [builder] / dark");
  });

  it("Map/Set 草稿：0 与空字符串是独立键，Set 去重", () => {
    const demo = mount("signal-collections");
    expect(demo.read("counts.get(0)")).toBe("1");
    expect(demo.read('counts.get("")')).toBe("100");

    demo.action("zero");
    expect(demo.read("counts.get(0)")).toBe("2");
    expect(demo.read('counts.get("")')).toBe("100");
    expect(demo.read("初始快照的 0 键")).toBe("1");

    demo.action("empty");
    expect(demo.read('counts.get("")')).toBe("101");

    demo.action("toggle");
    expect(demo.read("tags")).toEqual(["core", "design"]);

    demo.action("duplicate");
    expect(demo.read("tags")).toEqual(["core", "design"]);
    expect(demo.messages().at(-1)).toContain("内容不变：true");
    expect(demo.messages().at(-1)).toContain("快照引用相同：false");
  });

  it("自定义 equals：同 id 的新对象被丢弃", () => {
    const demo = mount("signal-equals");
    demo.action("same-id");
    expect(demo.read("当前值")).toBe("Ada #1");
    expect(demo.read("通知次数")).toBe("0");
    expect(demo.read("旧引用是否保留")).toContain("是");

    demo.action("next-id");
    expect(demo.read("当前值")).toBe("Lin #2");
    expect(demo.read("通知次数")).toBe("1");
    expect(demo.read("旧引用是否保留")).toContain("否");
  });

  it("特殊值：函数值需要包一层，NaN 相等、±0 不等", () => {
    const demo = mount("signal-special-values");
    expect(demo.read("callback() 调用结果")).toBe("hello");
    expect(demo.read("number")).toBe("NaN");

    demo.action("function");
    expect(demo.read("callback() 调用结果")).toBe("world");

    demo.action("undefined");
    expect(demo.read("optional")).toBe("undefined");

    demo.action("nan");
    expect(demo.read("number 通知次数")).toBe("0");

    demo.action("zero");
    expect(demo.read("number")).toBe("0");
    expect(demo.read("number 通知次数")).toBe("1");

    demo.action("zero");
    expect(demo.read("number")).toBe("−0");
    expect(demo.read("number 通知次数")).toBe("2");
  });

  it("订阅生命周期：退订后写入不再回调", () => {
    const demo = mount("signal-subscribe");
    expect(demo.read("订阅状态")).toBe("未订阅");

    demo.action("write");
    expect(demo.read("收到回调次数")).toBe("0");

    demo.action("subscribe");
    expect(demo.read("订阅状态")).toBe("已订阅");
    demo.action("write");
    expect(demo.read("收到回调次数")).toBe("1");

    demo.action("unsubscribe");
    expect(demo.read("订阅状态")).toBe("未订阅");
    demo.action("write");
    expect(demo.read("收到回调次数")).toBe("1");
  });
});
