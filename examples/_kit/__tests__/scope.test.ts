import { describe, expect, it } from "rstack/test";
import { mount } from "./harness";

describe("scope 示例", () => {
  it("作用域覆盖不影响全局读取", () => {
    const demo = mount("scope-override");
    expect(demo.read("count.get()（全局）")).toBe("0");
    expect(demo.read("scope.get(count)")).toBe("0");

    demo.action("override");
    expect(demo.read("scope.get(count)")).toBe("10");
    expect(demo.read("count.get()（全局）")).toBe("0");
    expect(demo.read("覆盖条目")).toBe("1");

    demo.action("global");
    expect(demo.read("count.get()（全局）")).toBe("1");
    expect(demo.read("scope.get(count)")).toBe("10");

    demo.action("reset-scope");
    expect(demo.read("scope.get(count)")).toBe("1");
    expect(demo.read("覆盖条目")).toBe("0");
  });

  it("fork 子作用域动态继承父级", () => {
    const demo = mount("scope-fork");
    expect(demo.read("全局 → 父 → 子")).toEqual([
      { label: "全局 signal", value: "light" },
      { label: "父作用域", value: "dusk" },
      { label: "子作用域", value: "dusk" },
    ]);

    demo.action("child");
    expect(demo.read("全局 → 父 → 子")).toEqual([
      { label: "全局 signal", value: "light" },
      { label: "父作用域", value: "dusk" },
      { label: "子作用域", value: "solar" },
    ]);

    demo.action("parent");
    expect(demo.read("全局 → 父 → 子")).toEqual([
      { label: "全局 signal", value: "light" },
      { label: "父作用域", value: "dawn" },
      { label: "子作用域", value: "solar" },
    ]);
  });

  it("序列化只包含本作用域的覆盖值", () => {
    const demo = mount("scope-serialize");
    const parent = JSON.parse(String(demo.read("父作用域快照"))) as Record<string, unknown>;
    const child = JSON.parse(String(demo.read("子作用域快照"))) as Record<string, unknown>;

    expect(Object.values(parent)).toEqual([10]);
    expect(Object.values(child)).toEqual(["child"]);
    expect(demo.read("子作用域条目数")).toBe("1");

    demo.action("mutate-child");
    expect(Object.values(JSON.parse(String(demo.read("子作用域快照"))))).toEqual(["editor"]);

    demo.action("stable");
    expect(demo.logs.at(-1)?.text).toContain("键名稳定");
  });

  it("作用域写入不触发全局订阅", () => {
    const demo = mount("scope-isolation");
    demo.action("scope-write");
    expect(demo.read("全局通知次数")).toBe("0");
    expect(demo.read("scope.get(count)")).toBe("99");

    demo.action("global-write");
    expect(demo.read("全局通知次数")).toBe("1");
    expect(demo.read("count.get()")).toBe("1");
  });
});
