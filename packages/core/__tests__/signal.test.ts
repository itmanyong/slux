import { describe, expect, it } from "rstack/test";
import { signal } from "../src/signal.js";
import { effect } from "../src/effect.js";
import { batch } from "../src/batch.js";

describe("reactivity/signal", () => {
  it("同步写入并在订阅后续变化时通知", () => {
    const count = signal(1);
    const values: number[] = [];
    const stop = count.subscribe((value) => values.push(value));
    expect(values).toEqual([]);
    count.set(2);
    count.set((value) => value + 3);
    expect(count.get()).toBe(5);
    expect(values).toEqual([2, 5]);
    stop();
    stop();
    count.set(6);
    expect(values).toEqual([2, 5]);
  });

  it("用 Object.is 比较 NaN 和有符号零", () => {
    const value = signal(NaN);
    const values: number[] = [];
    value.subscribe((next) => values.push(next));
    value.set(NaN);
    expect(values).toEqual([]);
    value.set(0);
    value.set(-0);
    value.set(0);
    expect(values).toEqual([0, -0, 0]);
    expect(Object.is(value.get(), 0)).toBe(true);
  });

  it("自定义相等时保留之前的对象引用", () => {
    const initial = { id: 1, label: "initial" };
    const value = signal(initial, { equals: (a, b) => a.id === b.id });
    value.set({ id: 1, label: "replacement" });
    value.set((draft) => {
      draft.label = "draft";
    });
    expect(value.get()).toBe(initial);
    const next = { id: 2, label: "next" };
    value.set(next);
    expect(value.get()).toBe(next);
    expect(initial).toEqual({ id: 1, label: "initial" });
    expect(Object.isFrozen(next)).toBe(false);
  });

  it("通过 draft 修改嵌套对象和数组，保留旧值与未修改分支", () => {
    const initial = {
      user: { name: "Alice" },
      items: [1, 2],
      unchanged: { id: 1 },
    };
    const value = signal(initial);
    const names: string[] = [];
    const stop = effect(() => {
      names.push(value.get().user.name);
    });
    value.set((draft) => {
      draft.user.name = "Bob";
      draft.items.push(3);
    });
    expect(value.get()).toEqual({
      user: { name: "Bob" },
      items: [1, 2, 3],
      unchanged: { id: 1 },
    });
    expect(value.get().unchanged).toBe(initial.unchanged);
    expect(initial.user.name).toBe("Alice");
    expect(initial.items).toEqual([1, 2]);
    expect(names).toEqual(["Alice", "Bob"]);
    stop();
  });

  it("通过 draft 修改根集合，批处理中合并通知", () => {
    const initial = new Map([["a", { count: 1 }]]);
    const value = signal(initial);
    const selected = signal(new Set([1]));
    const counts: number[] = [];
    value.subscribe((next) => counts.push(next.get("a")!.count));
    batch(() => {
      value.set((draft) => {
        draft.get("a")!.count++;
      });
      value.set((draft) => {
        draft.get("a")!.count++;
      });
      selected.set((draft) => {
        draft.add(2);
      });
      expect(value.get().get("a")!.count).toBe(3);
      expect(counts).toEqual([]);
    });
    expect(counts).toEqual([3]);
    expect(initial.get("a")).toEqual({ count: 1 });
    expect([...selected.get()]).toEqual([1, 2]);
  });

  it("draft 未修改时保留引用且不通知", () => {
    const initial = { count: 1 };
    const value = signal(initial);
    let notifications = 0;
    value.subscribe(() => {
      notifications++;
    });
    value.set(() => {});
    value.set((draft) => {
      draft.count = 1;
    });
    expect(value.get()).toBe(initial);
    expect(notifications).toBe(0);
  });

  it.each([0, false, null, undefined, NaN])("Map 的假值键 %s 与空字符串键保持独立，连续 draft 更新不破坏快照", (key) => {
    const initial = new Map<unknown, { count: number }>([
      [key, { count: 1 }],
      ["", { count: 10 }],
    ]);
    const value = signal(initial);
    const counts: number[] = [];
    value.subscribe((next) => counts.push(next.get(key)!.count));
    value.set((draft) => {
      draft.get(key)!.count++;
    });
    const first = value.get();
    expect(first.get(key)!.count).toBe(2);
    expect(first.get("")).toBe(initial.get(""));
    expect([...first.keys()]).toEqual([key, ""]);
    value.set((draft) => {
      draft.get(key)!.count++;
    });
    expect(value.get().get(key)!.count).toBe(3);
    expect(first.get(key)!.count).toBe(2);
    expect(initial.get(key)!.count).toBe(1);
    expect(initial.get("")!.count).toBe(10);
    expect(counts).toEqual([2, 3]);
    const last = value.get();
    value.set((draft) => {
      draft.get(key);
    });
    expect(value.get()).toBe(last);
    expect(counts).toEqual([2, 3]);
  });

  it("修改嵌套 Map 的其他项后，未访问的零键值仍可读取且共享原始引用", () => {
    const initial = {
      items: new Map([
        [0, { count: 0 }],
        [1, { count: 1 }],
      ]),
    };
    const value = signal(initial);
    value.set((draft) => {
      draft.items.get(1)!.count++;
    });
    expect(value.get().items.get(0)).toBe(initial.items.get(0));
    expect(value.get().items.get(0)!.count).toBe(0);
    expect(value.get().items.get(1)!.count).toBe(2);
    expect([...value.get().items.keys()]).toEqual([0, 1]);
    expect(initial.items.get(1)!.count).toBe(1);
  });

  it("Set.forEach 中的对象经过 draft 修改后仍可读取，保留旧快照", () => {
    const initial = new Set([{ count: 1 }]);
    const value = signal(initial);
    value.set((draft) => {
      draft.forEach((item) => {
        item.count++;
      });
    });
    expect([...value.get()]).toEqual([{ count: 2 }]);
    expect([...initial]).toEqual([{ count: 1 }]);
  });

  it("回调可返回替换值，undefined 通过直接传值写入", () => {
    const value = signal<{ count: number } | undefined>({ count: 1 });
    const replacement = { count: 2 };
    value.set(() => replacement);
    expect(value.get()).toBe(replacement);
    value.set(undefined);
    expect(value.get()).toBeUndefined();
    value.set(() => ({ count: 3 }));
    expect(value.get()).toEqual({ count: 3 });
    const zero = signal(0);
    zero.set(() => -0);
    expect(Object.is(zero.get(), -0)).toBe(true);
  });

  it("函数值通过返回该函数的回调保存而不执行", () => {
    const initial = () => 1;
    let calls = 0;
    const next = () => {
      calls++;
      return 2;
    };
    const value = signal(initial);
    value.set(() => next);
    expect(value.get()).toBe(next);
    expect(calls).toBe(0);
    expect(value.get()()).toBe(2);
  });

  it("返回 draft 时无修改保持引用，修改后提交可读取的普通值", () => {
    const initial = { nested: { count: 1 }, unchanged: { id: 2 } };
    const value = signal(initial);
    value.set((draft) => draft);
    expect(value.get()).toBe(initial);
    value.set((draft) => {
      draft.nested.count = 2;
      return draft;
    });
    expect(value.get().nested.count).toBe(2);
    expect(value.get().unchanged).toBe(initial.unchanged);
    expect(initial.nested.count).toBe(1);
  });

  it("返回的新对象和集合中的草稿引用会在提交前转换为普通值", () => {
    const initial = {
      count: 1,
      nested: { name: "Alice" },
      list: [{ id: 1 }],
      map: new Map([["a", { id: 2 }]]),
      set: new Set([{ id: 3 }]),
    };
    const value = signal(initial);
    value.set((draft) => ({
      ...draft,
      count: 2,
      list: [...draft.list],
      map: new Map(draft.map),
      set: new Set(draft.set),
    }));
    expect(value.get().count).toBe(2);
    expect(value.get().nested).toBe(initial.nested);
    expect(value.get().nested.name).toBe("Alice");
    expect(value.get().list[0]).toBe(initial.list[0]);
    expect(value.get().list[0]!.id).toBe(1);
    expect(value.get().map.get("a")).toBe(initial.map.get("a"));
    expect(value.get().map.get("a")!.id).toBe(2);
    expect([...value.get().set][0]).toBe([...initial.set][0]);
    expect([...value.get().set][0]!.id).toBe(3);
    expect(initial.count).toBe(1);
  });

  it("draft 修改后抛错不会提交或通知，之后仍能正常写入", () => {
    const initial = { nested: { count: 1 } };
    const value = signal(initial);
    const counts: number[] = [];
    value.subscribe((next) => counts.push(next.nested.count));
    expect(() =>
      value.set((draft) => {
        draft.nested.count = 2;
        throw new Error("draft");
      }),
    ).toThrow("draft");
    expect(value.get()).toBe(initial);
    expect(initial.nested.count).toBe(1);
    expect(counts).toEqual([]);
    value.set((draft) => {
      draft.nested.count = 3;
    });
    expect(counts).toEqual([3]);
  });

  it("复杂值和循环引用经过 limu 提交后仍保持原始引用", () => {
    const cycle: { self?: unknown } = {};
    cycle.self = cycle;
    const value = signal<unknown>(null);
    const values = [cycle, Object.freeze({ id: 1 }), new Date(0), new Set([1]), new Uint8Array([1, 2])];
    for (const next of values) {
      value.set(next);
      expect(value.get()).toBe(next);
    }
  });

  it.each([undefined, null, "text", true, 1n, Symbol.for("test"), () => 1])("保留任意值及其引用：%s", (initial) => {
    const value = signal<unknown>(initial);
    expect(value.get()).toBe(initial);
    const next = new Map([["a", { count: 1 }]]);
    value.set(next);
    expect(value.get()).toBe(next);
    expect(next.get("a")).toEqual({ count: 1 });
  });

  it("set 回调失败不提交状态且回调中的读取不会收集依赖", () => {
    const source = signal(1);
    const target = signal(0);
    const unrelated = signal(0);
    let runs = 0;
    const stop = effect(() => {
      runs++;
      source.get();
      target.set((value) => {
        unrelated.get();
        return value + 1;
      });
    });
    source.set(2);
    unrelated.set(1);
    expect(runs).toBe(2);
    expect(() =>
      target.set(() => {
        throw new Error("recipe");
      }),
    ).toThrow("recipe");
    expect(target.get()).toBe(2);
    target.set(5);
    expect(runs).toBe(2);
    stop();
  });
});
