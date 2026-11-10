import { describe, expect, it, rstest } from "rstack/test";
import { batch, computed, effect } from "@slux/core";
import { observable, observe, ref, snapshot, subscribe } from "../src/index.js";

describe("core 集成与对象图", () => {
  it("同步执行并在显式 batch 中合并 observe", () => {
    const state = observable({ a: 0, b: 0 });
    const values: number[] = [];
    const dispose = observe(() => {
      values.push(state.a + state.b);
    });
    state.a = 1;
    expect(values).toEqual([0, 1]);
    batch(() => {
      state.a = 2;
      state.b = 3;
      expect(values).toEqual([0, 1]);
    });
    expect(values).toEqual([0, 1, 5]);
    dispose();
  });

  it("支持 core computed 与 effect 的属性依赖", () => {
    const state = observable({ a: 1, b: 2 });
    const sum = computed(() => state.a + state.b);
    const values: number[] = [];
    const dispose = effect(() => {
      values.push(sum.get());
    });
    state.a = 3;
    expect(values).toEqual([3, 5]);
    dispose();
  });

  it("snapshot 在 computed 内跟踪整个对象图", () => {
    const state = observable({ child: { count: 1 } });
    const count = computed(() => snapshot(state).child.count);
    expect(count.get()).toBe(1);
    state.child.count++;
    expect(count.get()).toBe(2);
  });

  it("函数属性赋值不会被 core 当成 recipe 执行", () => {
    const first = rstest.fn(() => 1);
    const next = rstest.fn(() => 2);
    const state = observable({ fn: first });
    const values: unknown[] = [];
    const dispose = observe(() => {
      values.push(state.fn);
    });
    state.fn = next;
    expect(values).toEqual([first, next]);
    expect(first).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    dispose();
  });

  it("observe 忽略返回的清理函数", () => {
    const state = observable({ n: 0 });
    const cleanup = rstest.fn();
    const dispose = observe(() => {
      void state.n;
      return cleanup;
    });
    state.n++;
    dispose();
    expect(cleanup).not.toHaveBeenCalled();
  });

  it("未访问的子树在根更新后保持结构共享", () => {
    const state = observable({ count: 0, nested: { deep: { n: 1 } } });
    const before = snapshot(state);
    state.count++;
    const after = snapshot(state);
    expect(after.nested).toBe(before.nested);
    state.nested.deep.n++;
    expect(snapshot(state).nested.deep.n).toBe(2);
    expect(before.nested.deep.n).toBe(1);
  });

  it("独立持有的子代理在父属性未访问时也传播", () => {
    const child = observable({ n: 0 });
    const parent = observable({ child });
    const listener = rstest.fn();
    subscribe(parent, listener);
    const before = snapshot(parent);
    child.n++;
    expect(listener).toHaveBeenCalledTimes(1);
    expect(snapshot(parent).child.n).toBe(1);
    expect(snapshot(parent)).not.toBe(before);
    expect(parent.child).toBe(child);
  });

  it("共享子对象保持引用且每个祖先只通知一次", () => {
    const child = { n: 0 };
    const parent = observable({ a: child, b: child });
    const listener = rstest.fn();
    subscribe(parent, listener);
    expect(parent.a).toBe(parent.b);
    parent.a.n++;
    expect(listener).toHaveBeenCalledTimes(1);
    const snap = snapshot(parent);
    expect(snap.a).toBe(snap.b);
    parent.a = { n: 2 };
    listener.mockClear();
    parent.b.n++;
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("循环对象的通知与快照不会无限递归", () => {
    type Node = { n: number; self?: Node };
    const raw: Node = { n: 0 };
    raw.self = raw;
    const state = observable(raw);
    const listener = rstest.fn();
    subscribe(state, listener);
    expect(state.self).toBe(state);
    const first = snapshot(state);
    expect(first.self).toBe(first);
    state.n++;
    const second = snapshot(state);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(second.self).toBe(second);
    expect(second.n).toBe(1);
    expect(first.n).toBe(0);
  });

  it("双向循环更新使整个环的快照引用正确", () => {
    type Node = { n: number; next?: Node };
    const a: Node = { n: 0 };
    const b: Node = { n: 1, next: a };
    a.next = b;
    const state = observable(a);
    const first = snapshot(state);
    state.next!.n = 2;
    const second = snapshot(state);
    expect(second.next!.next).toBe(second);
    expect(second.next!.n).toBe(2);
    expect(first.next!.n).toBe(1);
  });

  it("替换和删除子对象后解除旧父链", () => {
    const old = observable({ n: 0 });
    const state = observable<{ child?: { n: number } }>({ child: old });
    const listener = rstest.fn();
    subscribe(state, listener);
    state.child = { n: 1 };
    listener.mockClear();
    old.n++;
    expect(listener).not.toHaveBeenCalled();
    const replacement = state.child;
    delete state.child;
    listener.mockClear();
    replacement.n++;
    expect(listener).not.toHaveBeenCalled();
  });

  it("Object.is 相等写入不通知，区分 0 与 -0", () => {
    const state = observable({ n: NaN });
    const listener = rstest.fn();
    subscribe(state, listener);
    state.n = NaN;
    expect(listener).not.toHaveBeenCalled();
    state.n = 0;
    state.n = -0;
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("订阅异常不阻止其他订阅及 core effect", () => {
    const state = observable({ n: 0 });
    const failure = new Error("listener");
    const stop = subscribe(state, () => {
      throw failure;
    });
    const other = rstest.fn();
    subscribe(state, other);
    const values: number[] = [];
    const dispose = observe(() => {
      values.push(state.n);
    });
    expect(() => {
      state.n++;
    }).toThrow(failure);
    expect(other).toHaveBeenCalledTimes(1);
    expect(values).toEqual([0, 1]);
    stop();
    state.n++;
    expect(values).toEqual([0, 1, 2]);
    dispose();
  });

  it("同时报告多个订阅错误并通知父订阅", () => {
    const state = observable({ child: { n: 0 } });
    subscribe(state.child, () => {
      throw new Error("child");
    });
    subscribe(state, () => {
      throw new Error("parent");
    });
    const listener = rstest.fn();
    subscribe(state, listener);
    expect(() => {
      state.child.n++;
    }).toThrow(AggregateError);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(snapshot(state).child.n).toBe(1);
  });

  it("订阅中退订和新增订阅不破坏当前遍历", () => {
    const state = observable({ n: 0 });
    const added = rstest.fn();
    const removed = rstest.fn();
    let remove = () => {};
    subscribe(state, () => {
      remove();
      subscribe(state, added);
    });
    remove = subscribe(state, removed);
    state.n++;
    expect(removed).not.toHaveBeenCalled();
    expect(added).not.toHaveBeenCalled();
    state.n++;
    expect(added).toHaveBeenCalledTimes(1);
  });

  it("subscribe 在 batch 内逐次同步执行", () => {
    const state = observable({ n: 0 });
    const values: number[] = [];
    subscribe(state, () => {
      values.push(state.n);
    });
    batch(() => {
      state.n = 1;
      expect(values).toEqual([1]);
      state.n = 2;
      expect(values).toEqual([1, 2]);
    });
  });
});

describe("属性和数组边界", () => {
  it("新增 undefined 属性也通知键与存在性观察者", () => {
    const state = observable<Record<string, unknown>>({});
    const keys: string[][] = [];
    const presence: boolean[] = [];
    const disposeKeys = observe(() => {
      keys.push(Object.keys(state));
    });
    const disposePresence = observe(() => {
      presence.push("n" in state);
    });
    state["n"] = undefined;
    delete state["n"];
    expect(keys).toEqual([[], ["n"], []]);
    expect(presence).toEqual([false, true, false]);
    disposeKeys();
    disposePresence();
  });

  it("已有属性改值不触发键和存在性依赖", () => {
    const state = observable({ n: 0 });
    const keys = rstest.fn(() => {
      Object.keys(state);
    });
    const presence = rstest.fn(() => {
      void ("n" in state);
    });
    const disposeKeys = observe(keys);
    const disposePresence = observe(presence);
    state.n++;
    expect(keys).toHaveBeenCalledTimes(1);
    expect(presence).toHaveBeenCalledTimes(1);
    disposeKeys();
    disposePresence();
  });

  it("数组截断同步更新索引、长度、存在性与快照", () => {
    const state = observable([1, 2, 3]);
    const values: unknown[] = [];
    const dispose = observe(() => {
      values.push([state[2], state.length, 2 in state]);
    });
    state.length = 1;
    expect(values).toEqual([
      [3, 3, true],
      [undefined, 1, false],
    ]);
    expect(snapshot(state)).toEqual([1]);
    dispose();
  });

  it("数组扩展、splice 和 sort 可以放进批处理", () => {
    const state = observable([3, 1, 2]);
    const values: number[][] = [];
    const dispose = observe(() => {
      values.push([...state]);
    });
    batch(() => {
      state.splice(1, 1);
      state.push(4);
      state.sort();
    });
    expect(values).toEqual([
      [3, 1, 2],
      [2, 3, 4],
    ]);
    dispose();
  });

  it("数组截断会解除被移除子项的父链", () => {
    const child = observable({ n: 0 });
    const state = observable([child]);
    const listener = rstest.fn();
    subscribe(state, listener);
    state.length = 0;
    listener.mockClear();
    child.n++;
    expect(listener).not.toHaveBeenCalled();
  });

  it("稀疏数组快照保留空洞和长度", () => {
    const state = observable(new Array<number>(4));
    state[1] = 2;
    const snap = snapshot(state);
    expect(snap.length).toBe(4);
    expect(0 in snap).toBe(false);
    expect(1 in snap).toBe(true);
    expect(3 in snap).toBe(false);
  });

  it("symbol 属性支持跟踪、嵌套传播和快照", () => {
    const key = Symbol("key");
    const state = observable({ [key]: { n: 0 } });
    const values: number[] = [];
    const dispose = observe(() => {
      values.push(state[key].n);
    });
    state[key].n++;
    expect(values).toEqual([0, 1]);
    expect(snapshot(state)[key].n).toBe(1);
    dispose();
  });

  it("null 原型与 __proto__ 自有属性安全保留", () => {
    const raw = Object.create(null) as Record<string, unknown>;
    raw["__proto__"] = { n: 1 };
    const state = observable(raw);
    const snap = snapshot(state);
    expect(Object.getPrototypeOf(snap)).toBeNull();
    expect(Object.hasOwn(snap, "__proto__")).toBe(true);
    expect(snap["__proto__"]).toEqual({ n: 1 });
  });

  it("内建对象和 ref 保留原引用且不被冻结", () => {
    const date = new Date(0);
    const map = new Map([["n", 1]]);
    const wrapped = ref({ n: 0 });
    const state = observable({ deep: { date, map, wrapped } });
    const snap = snapshot(state);
    expect(snap.deep.date).toBe(date);
    expect(snap.deep.map).toBe(map);
    expect(snap.deep.wrapped).toBe(wrapped);
    expect(Object.isFrozen(date)).toBe(false);
    expect(Object.isFrozen(wrapped)).toBe(false);
  });

  it("defineProperty 与访问器写入遵循属性依赖", () => {
    const state = observable({
      n: 0,
      get double() {
        return this.n * 2;
      },
      set double(value: number) {
        this.n = value / 2;
      },
    });
    const values: number[] = [];
    const dispose = observe(() => {
      values.push(state.double);
    });
    state.double = 4;
    Object.defineProperty(state, "n", { value: 3 });
    expect(values).toEqual([0, 4, 6]);
    expect(snapshot(state).double).toBe(6);
    dispose();
  });

  it("不可写属性写入失败不产生通知", () => {
    const raw = { n: 0 };
    Object.defineProperty(raw, "n", { writable: false });
    const state = observable(raw);
    const listener = rstest.fn();
    subscribe(state, listener);
    expect(Reflect.set(state, "n", 1)).toBe(false);
    expect(listener).not.toHaveBeenCalled();
    expect(state.n).toBe(0);
  });

  it("不可配置且不可写的对象属性遵守 Proxy 不变量", () => {
    const child = { n: 0 };
    const state = observable(Object.freeze({ child }));
    expect(state.child).toBe(child);
    expect(snapshot(state).child).toEqual({ n: 0 });
  });
});
