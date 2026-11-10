import { describe, it, expect, rstest } from "rstack/test";
import { observable, observe, ref, snapshot } from "../src/index.js";

describe("ref", () => {
  it("wraps a value in a ref object", () => {
    const r = ref(42);
    expect(r.current).toBe(42);
  });

  it("wraps objects without proxying them", () => {
    const obj = { deeply: { nested: true } };
    const state = observable({ data: ref(obj) });
    expect(state.data.current).toBe(obj);
    expect(state.data.current.deeply.nested).toBe(true);
  });

  it("changes to ref.current are not tracked", async () => {
    const obj = { count: 0 };
    const state = observable({ data: ref(obj) });
    const fn = rstest.fn(() => {
      void state.data;
    });

    observe(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    state.data.current.count = 5;
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("reassigning the whole ref triggers notification", async () => {
    const state = observable({ data: ref({ count: 0 }) });
    const fn = rstest.fn(() => {
      void state.data;
    });

    observe(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    state.data = ref({ count: 1 });
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("ref values are included in snapshots as-is", () => {
    const obj = { count: 0 };
    const r = ref(obj);
    const state = observable({ data: r });
    const snap = snapshot(state);

    expect(snap.data).toBe(r);
  });

  it("works with DOM-like objects", () => {
    const element = { tagName: "CANVAS", nodeType: 1 };
    const state = observable({ canvas: ref(element) });
    expect(state.canvas.current).toBe(element);
  });

  it("works with null and undefined values", () => {
    const r1 = ref(null);
    expect(r1.current).toBeNull();

    const r2 = ref(undefined);
    expect(r2.current).toBeUndefined();
  });
});
