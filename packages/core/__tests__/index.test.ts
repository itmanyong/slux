import { describe, expect, it } from "rstack/test";
import { effect, signal } from "../src/index.js";

describe("index", () => {
  it("通知引发的写入和 effect 引发的写入都在返回前完成", () => {
    const a = signal(0);
    const b = signal(0);
    const c = signal(0);
    a.subscribe((value) => {
      b.set(value * 2);
    });
    const stop = effect(() => {
      c.set(b.get() + 1);
    });
    const values: number[] = [];
    c.subscribe((value) => values.push(value));
    a.set(2);
    expect(c.get()).toBe(5);
    expect(values).toEqual([5]);
    stop();
  });
});
