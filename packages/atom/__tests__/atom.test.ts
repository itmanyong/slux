import { describe, expect, it } from "rstack/test";
import { batch, computed, effect, signal } from "@slux/core";
import { atom, atomFamily, createAtomScope, derived, writableAtom } from "../src/index.js";

describe("atom", () => {
  it("读取、替换与函数更新，订阅不立即触发", () => {
    const count = atom(1);
    const values: number[] = [];
    const stop = count.subscribe((value) => values.push(value));
    expect(count.get()).toBe(1);
    expect(values).toEqual([]);
    count.set(2);
    count.update((value) => value + 3);
    expect(count.get()).toBe(5);
    expect(values).toEqual([2, 5]);
    stop();
    stop();
    count.set(6);
    expect(values).toEqual([2, 5]);
  });

  it("使用 Object.is 判断 NaN 与有符号零", () => {
    const count = atom(NaN);
    const values: number[] = [];
    const stop = count.subscribe((value) => values.push(value));
    count.set(NaN);
    count.set(0);
    count.set(-0);
    count.update((value) => value);
    expect(values).toEqual([0, -0]);
    stop();
  });

  it("保留对象引用并支持 undefined、null 与函数值替换", () => {
    const initial = { count: 1 };
    const state = atom<object | null | undefined>(initial);
    expect(state.get()).toBe(initial);
    const replacement = { count: 2 };
    state.set(replacement);
    expect(state.get()).toBe(replacement);
    state.set(undefined);
    expect(state.get()).toBeUndefined();
    state.set(null);
    expect(state.get()).toBeNull();
    let calls = 0;
    const fn = () => ++calls;
    const callback = atom<(() => number) | undefined>(undefined);
    callback.set(fn);
    expect(callback.get()).toBe(fn);
    callback.update(() => fn);
    expect(calls).toBe(0);
    callback.set(undefined);
    expect(callback.get()).toBeUndefined();
  });

  it("多个订阅相互独立，订阅期间批处理只发送最终值", () => {
    const count = atom(0);
    const first: number[] = [];
    const second: number[] = [];
    const stopFirst = count.subscribe((value) => first.push(value));
    const stopSecond = count.subscribe((value) => second.push(value));
    batch(() => {
      count.set(1);
      count.set(2);
    });
    stopFirst();
    count.set(3);
    expect(first).toEqual([2]);
    expect(second).toEqual([2, 3]);
    stopSecond();
  });

  it("可以被 core computed 和 effect 读取", () => {
    const count = atom(1);
    const doubled = computed(() => count.get() * 2);
    const values: number[] = [];
    const stop = effect(() => {
      values.push(doubled.get());
    });
    count.set(2);
    expect(values).toEqual([2, 4]);
    stop();
  });
});

describe("derived", () => {
  it("惰性缓存，在依赖变化后按需计算", () => {
    const count = atom(1);
    let calls = 0;
    const doubled = derived((get) => {
      calls++;
      return get(count) * 2;
    });
    expect(calls).toBe(0);
    expect(doubled.get()).toBe(2);
    expect(doubled.get()).toBe(2);
    expect(calls).toBe(1);
    count.set(2);
    expect(calls).toBe(1);
    expect(doubled.get()).toBe(4);
    expect(calls).toBe(2);
    expect(doubled).not.toHaveProperty("set");
  });

  it("主动通知派生订阅，菱形依赖不产生中间值", () => {
    const source = atom(1);
    const left = derived((get) => get(source) + 1);
    const right = derived((get) => get(source) + 2);
    const total = derived((get) => get(left) + get(right));
    const values: number[] = [];
    const stop = total.subscribe((value) => values.push(value));
    source.set(10);
    expect(values).toEqual([23]);
    stop();
    source.set(20);
    expect(values).toEqual([23]);
  });

  it("动态分支移除不再读取的依赖", () => {
    const enabled = atom(true);
    const left = atom("a");
    const right = atom("b");
    let calls = 0;
    const selected = derived((get) => {
      calls++;
      return get(enabled) ? get(left) : get(right);
    });
    const values: string[] = [];
    const stop = selected.subscribe((value) => values.push(value));
    enabled.set(false);
    expect(calls).toBe(2);
    left.set("unused");
    expect(calls).toBe(2);
    right.set("next");
    expect(values).toEqual(["b", "next"]);
    stop();
  });

  it("派生结果相等时不通知", () => {
    const count = atom(0);
    const positive = derived((get) => get(count) > 0);
    const values: boolean[] = [];
    const stop = positive.subscribe((value) => values.push(value));
    count.set(1);
    count.set(2);
    count.set(0);
    expect(values).toEqual([true, false]);
    stop();
  });

  it("清理最后一个订阅后恢复惰性求值", () => {
    const count = atom(0);
    let calls = 0;
    const doubled = derived((get) => {
      calls++;
      return get(count) * 2;
    });
    const stop = doubled.subscribe(() => {});
    expect(calls).toBe(1);
    stop();
    count.set(1);
    expect(calls).toBe(1);
    expect(doubled.get()).toBe(2);
    expect(calls).toBe(2);
  });

  it("批处理中创建订阅不会收到初始值", () => {
    const count = atom(0);
    const doubled = derived((get) => get(count) * 2);
    const values: number[] = [];
    let stop = () => {};
    batch(() => {
      stop = doubled.subscribe((value) => values.push(value));
    });
    expect(values).toEqual([]);
    count.set(1);
    expect(values).toEqual([2]);
    stop();
  });

  it("订阅回调的其他读取不成为依赖", () => {
    const source = atom(0);
    const unrelated = atom(0);
    const values: number[] = [];
    const stop = source.subscribe((value) => {
      unrelated.get();
      values.push(value);
    });
    source.set(1);
    unrelated.set(2);
    expect(values).toEqual([1]);
    stop();
  });

  it("支持 core signal 输入和 Promise 结果", async () => {
    const source = signal(1);
    const value = derived(async (get) => get(source) * 2);
    const initial = value.get();
    expect(value.get()).toBe(initial);
    await expect(initial).resolves.toBe(2);
    source.set(3);
    const next = value.get();
    expect(next).not.toBe(initial);
    await expect(next).resolves.toBe(6);
  });

  it("计算失败可以在依赖修复后重试", () => {
    const valid = atom(false);
    const value = derived((get) => {
      if (!get(valid)) throw new Error("invalid");
      return "ready";
    });
    expect(() => value.get()).toThrow("invalid");
    valid.set(true);
    expect(value.get()).toBe("ready");
  });
});

describe("writableAtom", () => {
  it("只写 atom 保持 null 并返回写入结果", () => {
    const count = atom(0);
    const increment = writableAtom(null, (get, set, amount: number) => {
      const previous = get(count);
      set(count, previous + amount);
      return previous;
    });
    const values: unknown[] = [];
    const stop = increment.subscribe((value) => values.push(value));
    expect(increment.write(3)).toBe(0);
    expect(increment.write(2)).toBe(3);
    expect(count.get()).toBe(5);
    expect(increment.get()).toBeNull();
    expect(values).toEqual([]);
    stop();
  });

  it("读写 atom 支持转换和订阅", () => {
    const celsius = atom(0);
    const fahrenheit = writableAtom(
      (get) => (get(celsius) * 9) / 5 + 32,
      (_get, set, next: number) => set(celsius, ((next - 32) * 5) / 9),
    );
    const values: number[] = [];
    const stop = fahrenheit.subscribe((value) => values.push(value));
    expect(fahrenheit.get()).toBe(32);
    fahrenheit.write(212);
    expect(celsius.get()).toBe(100);
    expect(values).toEqual([212]);
    stop();
  });

  it("整个 write 批处理多次 set，写入中能读取新值", () => {
    const left = atom(0);
    const right = atom(0);
    const sum = derived((get) => get(left) + get(right));
    const values: number[] = [];
    const stop = sum.subscribe((value) => values.push(value));
    const setPair = writableAtom(null, (get, set) => {
      set(left, 2);
      set(right, get(left) + 1);
      return get(sum);
    });
    expect(setPair.write()).toBe(5);
    expect(values).toEqual([5]);
    stop();
  });

  it("嵌套 write 共享外层批处理", () => {
    const count = atom(0);
    const values: number[] = [];
    const stop = count.subscribe((value) => values.push(value));
    const inner = writableAtom(null, (get, set) => set(count, get(count) + 1));
    const outer = writableAtom(null, (get, set) => {
      inner.write();
      set(count, get(count) + 1);
    });
    outer.write();
    expect(values).toEqual([2]);
    stop();
  });

  it("write 抛错仍提交已完成的写入并恢复后续通知", () => {
    const count = atom(0);
    const values: number[] = [];
    const stop = count.subscribe((value) => values.push(value));
    const fail = writableAtom(null, (_get, set) => {
      set(count, 1);
      throw new Error("failed");
    });
    expect(() => fail.write()).toThrow("failed");
    count.set(2);
    expect(values).toEqual([1, 2]);
    stop();
  });
});

describe("createAtomScope", () => {
  it("各作用域的基础、链式派生和读写 atom 读取均隔离", () => {
    const count = atom(1);
    const doubled = derived((get) => get(count) * 2);
    const writable = writableAtom(
      (get) => get(doubled) + 1,
      () => {},
    );
    const first = createAtomScope();
    const second = createAtomScope();
    first.set(count, 2);
    second.set(count, 3);
    expect(first.get(writable)).toBe(5);
    expect(second.get(writable)).toBe(7);
    expect(writable.get()).toBe(3);
    expect(first.get(count)).toBe(2);
  });

  it("作用域订阅隔离，并能清理派生订阅", () => {
    const count = atom(0);
    const doubled = derived((get) => get(count) * 2);
    const first = createAtomScope();
    const second = createAtomScope();
    const values: number[] = [];
    const stop = first.sub(doubled, (value) => values.push(value));
    second.set(count, 3);
    count.set(4);
    expect(values).toEqual([]);
    first.set(count, 5);
    expect(values).toEqual([10]);
    stop();
    first.set(count, 6);
    expect(values).toEqual([10]);
  });

  it("作用域保存函数值且不执行函数", () => {
    const first = () => 1;
    const second = () => 2;
    const callback = atom(first);
    const scope = createAtomScope();
    scope.set(callback, second);
    expect(scope.get(callback)).toBe(second);
    expect(callback.get()).toBe(first);
  });

  it("原始 core signal 不隔离，仍主动通知 core computed", () => {
    const source = signal(1);
    const doubled = computed(() => source.get() * 2);
    const scope = createAtomScope();
    const values: number[] = [];
    const stop = scope.sub(doubled, (value) => values.push(value));
    expect(scope.get(source)).toBe(1);
    source.set(2);
    expect(values).toEqual([4]);
    stop();
  });

  it("外部 Subscribable 的 subscribe 可直接互操作", () => {
    let current = 1;
    const listeners = new Set<(value: number) => void>();
    const source = {
      get: () => current,
      subscribe: (callback: (value: number) => void) => {
        listeners.add(callback);
        return () => {
          listeners.delete(callback);
        };
      },
    };
    const scope = createAtomScope();
    const values: number[] = [];
    const stop = scope.sub(source, (value) => values.push(value));
    current = 2;
    for (const listener of listeners) listener(current);
    expect(values).toEqual([2]);
    stop();
    expect(listeners.size).toBe(0);
  });
});

describe("atomFamily", () => {
  it("同参数复用，不同参数独立，remove 只移除缓存", () => {
    const family = atomFamily((id: string) => atom({ id, count: 0 }));
    const first = family("a");
    expect(family("a")).toBe(first);
    expect(family("b")).not.toBe(first);
    first.set({ id: "a", count: 2 });
    expect(family.remove("a")).toBe(true);
    expect(family.remove("a")).toBe(false);
    expect(family("a").get().count).toBe(0);
    expect(first.get().count).toBe(2);
  });

  it("参数按 SameValueZero 比较，对象按引用比较", () => {
    const family = atomFamily((key: unknown) => atom(key));
    expect(family(NaN)).toBe(family(NaN));
    expect(family(0)).toBe(family(-0));
    const key = {};
    expect(family(key)).toBe(family(key));
    expect(family({})).not.toBe(family({}));
  });

  it("缓存 undefined 结果，工厂失败后允许重试", () => {
    let calls = 0;
    const family = atomFamily((key: string) => {
      calls++;
      if (key === "fail") throw new Error("failed");
      return undefined;
    });
    expect(family("a")).toBeUndefined();
    expect(family("a")).toBeUndefined();
    expect(calls).toBe(1);
    expect(() => family("fail")).toThrow("failed");
    expect(() => family("fail")).toThrow("failed");
    expect(calls).toBe(3);
  });

  it("工厂支持派生 atom", () => {
    const counts = atomFamily((id: number) => atom(id));
    const doubles = atomFamily((id: number) => derived((get) => get(counts(id)) * 2));
    expect(doubles(2).get()).toBe(4);
    counts(2).set(3);
    expect(doubles(2).get()).toBe(6);
  });
});
