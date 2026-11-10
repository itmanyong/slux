import { describe, it, expect } from "rstack/test";
import { observable, snapshot } from "../src/index.js";

describe("snapshot", () => {
  it("creates an immutable copy of the state", () => {
    const state = observable({ count: 0 });
    const snap = snapshot(state);
    expect(snap.count).toBe(0);
    expect(Object.isFrozen(snap)).toBe(true);
  });

  it("reflects the current state", () => {
    const state = observable({ count: 0 });
    state.count = 5;
    const snap = snapshot(state);
    expect(snap.count).toBe(5);
  });

  it("deeply freezes nested objects", () => {
    const state = observable({ user: { name: "Alice" } });
    const snap = snapshot(state);
    expect(Object.isFrozen(snap)).toBe(true);
    expect(Object.isFrozen(snap.user)).toBe(true);
  });

  it("provides structural sharing for unchanged subtrees", () => {
    const state = observable({ a: 1, b: { c: 2 } });
    void state.b.c;

    const snap1 = snapshot(state);
    state.a = 10;
    const snap2 = snapshot(state);
    expect(snap2).not.toBe(snap1);
    expect(snap2.a).toBe(10);
    expect(snap2.b).toBe(snap1.b);
  });

  it("creates new snapshot reference when nested value changes", () => {
    const state = observable({ a: 1, b: { c: 2 } });
    void state.b.c;

    const snap1 = snapshot(state);
    state.b.c = 99;
    const snap2 = snapshot(state);

    expect(snap2.b).not.toBe(snap1.b);
    expect(snap2.b.c).toBe(99);
  });

  it("returns cached snapshot when nothing changed", () => {
    const state = observable({ count: 0 });
    const snap1 = snapshot(state);
    const snap2 = snapshot(state);
    expect(snap2).toBe(snap1);
  });

  it("handles arrays", () => {
    const state = observable({ items: [1, 2, 3] });
    const snap = snapshot(state);
    expect(snap.items).toEqual([1, 2, 3]);
    expect(Object.isFrozen(snap.items)).toBe(true);
    expect(Array.isArray(snap.items)).toBe(true);
  });

  it("handles deeply nested state", () => {
    const state = observable({
      a: { b: { c: { d: 42 } } },
    });
    void state.a.b.c.d;

    const snap = snapshot(state);
    expect(snap.a.b.c.d).toBe(42);
    expect(Object.isFrozen(snap.a.b.c)).toBe(true);
  });

  it("freezes nested objects that were never accessed via proxy", () => {
    const state = observable({
      accessed: { x: 1 },
      unaccessed: { y: 2 },
    });
    void state.accessed.x;

    const snap = snapshot(state);
    expect(snap.unaccessed.y).toBe(2);
    expect(Object.isFrozen(snap.unaccessed)).toBe(true);
  });

  it("preserves primitive values", () => {
    const state = observable({
      str: "hello",
      num: 42,
      bool: true,
      nil: null as string | null,
    });
    const snap = snapshot(state);
    expect(snap.str).toBe("hello");
    expect(snap.num).toBe(42);
    expect(snap.bool).toBe(true);
    expect(snap.nil).toBeNull();
  });

  it("structural sharing: unchanged array subtrees", () => {
    const state = observable({
      items: [{ id: 1 }, { id: 2 }],
      count: 0,
    });
    void state.items[0];
    void state.items[1];

    const snap1 = snapshot(state);
    state.count = 1;
    const snap2 = snapshot(state);
    expect(snap2.items).toBe(snap1.items);
  });

  it("handles already-proxied child stored as a value", () => {
    const child = observable({ x: 1 });
    const parent = observable({ child });

    const snap = snapshot(parent);
    expect(snap.child.x).toBe(1);
    expect(Object.isFrozen(snap.child)).toBe(true);
  });

  it("handles unproxied nested objects in hasChangedChildren", () => {
    const state = observable({
      nested: { deep: 42 },
      count: 0,
    });
    const snap1 = snapshot(state);
    expect(snap1.nested.deep).toBe(42);
    const snap2 = snapshot(state);
    expect(snap2).toBe(snap1);
  });

  it("detects child changes through hasChangedChildren", () => {
    const state = observable({
      a: { value: 1 },
      b: { value: 2 },
    });
    void state.a.value;
    void state.b.value;

    const snap1 = snapshot(state);
    state.a.value = 10;

    const snap2 = snapshot(state);
    expect(snap2.a.value).toBe(10);
    expect(snap2.a).not.toBe(snap1.a);
    expect(snap2.b).toBe(snap1.b);
  });
});
