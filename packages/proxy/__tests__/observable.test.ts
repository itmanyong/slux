import { describe, it, expect, rstest } from "rstack/test";
import { observable, subscribe } from "../src/index.js";

describe("observable", () => {
  it("creates a proxy from a plain object", () => {
    const state = observable({ count: 0 });
    expect(state.count).toBe(0);
  });

  it("supports direct mutation", () => {
    const state = observable({ count: 0 });
    state.count = 5;
    expect(state.count).toBe(5);
  });

  it("supports nested objects", () => {
    const state = observable({ user: { name: "Alice", age: 30 } });
    expect(state.user.name).toBe("Alice");

    state.user.name = "Bob";
    expect(state.user.name).toBe("Bob");
  });

  it("supports arrays", () => {
    const state = observable({ items: [1, 2, 3] });
    expect(state.items.length).toBe(3);
    expect(state.items[0]).toBe(1);
  });

  it("supports array push", () => {
    const state = observable({ items: [1, 2, 3] });
    state.items.push(4);
    expect(state.items.length).toBe(4);
    expect(state.items[3]).toBe(4);
  });

  it("supports array splice", () => {
    const state = observable({ items: [1, 2, 3] });
    state.items.splice(1, 1);
    expect(state.items).toEqual([1, 3]);
  });

  it("supports array index assignment", () => {
    const state = observable({ items: [1, 2, 3] });
    state.items[0] = 10;
    expect(state.items[0]).toBe(10);
  });

  it("supports delete property", () => {
    const state = observable({ a: 1, b: 2 } as Record<string, number>);
    delete state["b"];
    expect(state["b"]).toBeUndefined();
    expect("b" in state).toBe(false);
  });

  it("returns the same proxy for the same object", () => {
    const obj = { count: 0 };
    const proxy1 = observable(obj);
    const proxy2 = observable(obj);
    expect(proxy1).toBe(proxy2);
  });

  it("returns an already-observable proxy unchanged", () => {
    const state = observable({ count: 0 });
    const same = observable(state);
    expect(same).toBe(state);
  });

  it("throws for non-plain objects", () => {
    expect(() => observable(new Map() as never)).toThrow();
    expect(() => observable(new Set() as never)).toThrow();
    expect(() => observable(new Date() as never)).toThrow();
  });

  it("preserves property enumeration", () => {
    const state = observable({ a: 1, b: 2, c: 3 });
    expect(Object.keys(state)).toEqual(["a", "b", "c"]);
  });

  it("supports has check", () => {
    const state = observable({ count: 0 });
    expect("count" in state).toBe(true);
    expect("missing" in state).toBe(false);
  });

  it("supports getOwnPropertyDescriptor", () => {
    const state = observable({ count: 0 });
    const desc = Object.getOwnPropertyDescriptor(state, "count");
    expect(desc?.value).toBe(0);
  });

  it("handles deeply nested mutations", () => {
    const state = observable({
      a: { b: { c: { d: 0 } } },
    });
    state.a.b.c.d = 42;
    expect(state.a.b.c.d).toBe(42);
  });

  it("handles reassigning nested object", () => {
    const state = observable({ user: { name: "Alice" } });
    state.user = { name: "Bob" };
    expect(state.user.name).toBe("Bob");
  });

  it("handles null-prototype objects", () => {
    const obj = Object.create(null) as Record<string, number>;
    obj["count"] = 0;
    const state = observable(obj);
    state["count"] = 5;
    expect(state["count"]).toBe(5);
  });

  it("allows setting symbol properties", () => {
    const state = observable({ count: 0 } as Record<PropertyKey, unknown>);
    const sym = Symbol("test");
    state[sym] = "value";
    expect(state[sym]).toBe("value");
  });

  it("preserves correct prototype", () => {
    const state = observable({ count: 0 });
    expect(Object.getPrototypeOf(state)).toBe(Object.prototype);

    const arr = observable({ items: [1, 2] });
    expect(Object.getPrototypeOf(arr.items)).toBe(Array.prototype);
  });

  it("delete on non-existent property does not notify", () => {
    const state = observable({ a: 1 } as Record<string, number>);
    const listener = rstest.fn();
    subscribe(state, listener);
    delete state["nonexistent"];
    expect(listener).not.toHaveBeenCalled();
  });

  it("subscribe throws for non-observable objects", () => {
    expect(() => subscribe({ count: 0 }, rstest.fn())).toThrow("Object is not an observable");
  });

  it("cleans up child notification when reassigning nested object", () => {
    const state = observable({ user: { name: "Alice" } });
    const listener = rstest.fn();
    subscribe(state, listener);
    void state.user.name;
    state.user = { name: "Bob" };
    expect(listener).toHaveBeenCalled();
    listener.mockClear();
    void state.user.name;
    state.user.name = "Charlie";
    expect(listener).toHaveBeenCalled();
  });
});

describe("subscribe", () => {
  it("notifies on direct mutation", () => {
    const state = observable({ count: 0 });
    const listener = rstest.fn();
    subscribe(state, listener);

    state.count = 1;
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not notify when value is unchanged", () => {
    const state = observable({ count: 0 });
    const listener = rstest.fn();
    subscribe(state, listener);

    state.count = 0;
    expect(listener).not.toHaveBeenCalled();
  });

  it("notifies on nested mutation", () => {
    const state = observable({ user: { name: "Alice" } });
    const listener = rstest.fn();
    subscribe(state, listener);
    void state.user.name;
    state.user.name = "Bob";
    expect(listener).toHaveBeenCalled();
  });

  it("notifies on delete", () => {
    const state = observable({ a: 1 } as Record<string, number>);
    const listener = rstest.fn();
    subscribe(state, listener);

    delete state["a"];
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stops notifying after unsubscribe", () => {
    const state = observable({ count: 0 });
    const listener = rstest.fn();
    const unsub = subscribe(state, listener);

    state.count = 1;
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
    state.count = 2;
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("supports multiple subscribers", () => {
    const state = observable({ count: 0 });
    const a = rstest.fn();
    const b = rstest.fn();
    subscribe(state, a);
    subscribe(state, b);

    state.count = 1;
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("notifies on array push", () => {
    const state = observable({ items: [1, 2] });
    const listener = rstest.fn();
    subscribe(state, listener);
    void state.items.length;
    state.items.push(3);
    expect(listener).toHaveBeenCalled();
  });
});
