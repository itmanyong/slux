import { describe, expect, it } from "rstack/test";
import { computed } from "../../src/reactivity/computed.js";
import { signal } from "../../src/reactivity/signal.js";
import { createScope, runInScope, serializeScope, getCurrentScope } from "../../src/scope/scope.js";

describe("scope", () => {
  it("隔离不同作用域并回退到全局值", () => {
    const source = signal(1);
    const a = createScope();
    const b = createScope();
    a.set(source, 10);
    b.set(source, 20);
    expect(a.get(source)).toBe(10);
    expect(b.get(source)).toBe(20);
    expect(source.get()).toBe(1);
    expect(createScope().get(source)).toBe(1);
    expect(a.get(computed(() => source.get() * 2))).toBe(2);
  });

  it("父作用域动态继承，子作用域的 undefined 覆盖父值", () => {
    const source = signal<number | undefined>(0);
    const parent = createScope();
    const child = parent.fork();
    const grandchild = child.fork();
    parent.set(source, 1);
    expect(grandchild.get(source)).toBe(1);
    parent.set(source, 2);
    expect(grandchild.get(source)).toBe(2);
    child.set(source, undefined);
    expect(grandchild.get(source)).toBeUndefined();
    expect(parent.get(source)).toBe(2);
    grandchild.set(source, 3);
    expect(grandchild.get(source)).toBe(3);
    expect(child.get(source)).toBeUndefined();
  });

  it("序列化只包含自身赋值，键跨作用域稳定", () => {
    const a = signal(0);
    const b = signal(0);
    const parent = createScope();
    parent.set(a, 10);
    const child = parent.fork();
    child.set(b, 20);
    expect(Object.values(serializeScope(parent))).toEqual([10]);
    expect(Object.values(child.serialize())).toEqual([20]);
    const other = createScope();
    other.set(a, 30);
    expect(Object.keys(other.serialize())).toEqual(Object.keys(parent.serialize()));
    const snapshot = parent.serialize();
    parent.set(a, 40);
    expect(Object.values(snapshot)).toEqual([10]);
  });

  it("同步上下文嵌套和异常退出后恢复", () => {
    const outer = createScope();
    const inner = createScope();
    expect(getCurrentScope()).toBeUndefined();
    expect(
      runInScope(outer, () => {
        expect(getCurrentScope()).toBe(outer);
        expect(() =>
          runInScope(inner, () => {
            expect(getCurrentScope()).toBe(inner);
            throw new Error("scope");
          }),
        ).toThrow("scope");
        expect(getCurrentScope()).toBe(outer);
        return 42;
      }),
    ).toBe(42);
    expect(getCurrentScope()).toBeUndefined();
  });

  it("runInScope 保持显式读写契约，不隐式改写 signal", () => {
    const source = signal(0);
    const scope = createScope();
    scope.set(source, 10);
    runInScope(scope, () => {
      expect(source.get()).toBe(0);
      expect(scope.get(source)).toBe(10);
    });
  });
});
