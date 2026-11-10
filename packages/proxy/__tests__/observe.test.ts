import { describe, it, expect, rstest } from "rstack/test";
import { observable, observe } from "../src/index.js";

describe("observe", () => {
  it("runs synchronously on creation", () => {
    const state = observable({ count: 0 });
    const fn = rstest.fn(() => {
      void state.count;
    });

    observe(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("re-runs when accessed property changes", async () => {
    const state = observable({ count: 0 });
    const values: number[] = [];

    observe(() => {
      values.push(state.count);
    });
    expect(values).toEqual([0]);

    state.count = 1;
    await Promise.resolve();
    expect(values).toEqual([0, 1]);
  });

  it("does not re-run for unaccessed properties", async () => {
    const state = observable({ count: 0, name: "Alice" });
    const fn = rstest.fn(() => {
      void state.count;
    });

    observe(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    state.name = "Bob";
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("tracks nested property access", async () => {
    const state = observable({ user: { name: "Alice" } });
    const values: string[] = [];

    observe(() => {
      values.push(state.user.name);
    });
    expect(values).toEqual(["Alice"]);

    state.user.name = "Bob";
    await Promise.resolve();
    expect(values).toEqual(["Alice", "Bob"]);
  });

  it("stops observing after dispose", async () => {
    const state = observable({ count: 0 });
    const fn = rstest.fn(() => {
      void state.count;
    });

    const dispose = observe(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    dispose();
    state.count = 1;
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("dispose is idempotent", () => {
    const state = observable({ count: 0 });
    const dispose = observe(() => {
      void state.count;
    });

    dispose();
    dispose();
  });

  it("handles dynamic dependencies", async () => {
    const state = observable({ cond: true, a: "A", b: "B" });
    const values: string[] = [];

    observe(() => {
      values.push(state.cond ? state.a : state.b);
    });
    expect(values).toEqual(["A"]);
    state.b = "BB";
    await Promise.resolve();
    expect(values).toEqual(["A"]);
    state.cond = false;
    await Promise.resolve();
    expect(values).toEqual(["A", "BB"]);
    state.a = "AA";
    await Promise.resolve();
    expect(values).toEqual(["A", "BB"]);
    state.b = "BBB";
    await Promise.resolve();
    expect(values).toEqual(["A", "BB", "BBB"]);
  });

  it("handles multiple observers on the same proxy", async () => {
    const state = observable({ count: 0 });
    const a = rstest.fn(() => {
      void state.count;
    });
    const b = rstest.fn(() => {
      void state.count;
    });

    observe(a);
    observe(b);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    state.count = 1;
    await Promise.resolve();
    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(2);
  });

  it("handles array mutations", async () => {
    const state = observable({ items: [1, 2, 3] });
    const lengths: number[] = [];

    observe(() => {
      lengths.push(state.items.length);
    });
    expect(lengths).toEqual([3]);

    state.items.push(4);
    await Promise.resolve();
    expect(lengths).toEqual([3, 4]);
  });
});
