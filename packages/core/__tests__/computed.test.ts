import { describe, expect, it } from "rstack/test";
import { signal } from "../src/signal.js";
import { computed } from "../src/computed.js";
import { effect } from "../src/effect.js";

describe("reactivity/computed", () => {
  it("延迟计算且重复读取使用缓存", () => {
    const source = signal(2);
    let runs = 0;
    const doubled = computed(() => {
      runs++;
      return source.get() * 2;
    });
    expect(runs).toBe(0);
    expect(doubled.get()).toBe(4);
    expect(doubled.get()).toBe(4);
    expect(runs).toBe(1);
    source.set(3);
    expect(runs).toBe(1);
    expect(doubled.get()).toBe(6);
    expect(runs).toBe(2);
  });

  it("切换分支后释放旧依赖，支持重复和重排读取", () => {
    const condition = signal(true);
    const a = signal(1);
    const b = signal(10);
    let runs = 0;
    const result = computed(() => {
      runs++;
      return condition.get() ? a.get() + a.get() : b.get();
    });
    expect(result.get()).toBe(2);
    b.set(20);
    expect(result.get()).toBe(2);
    expect(runs).toBe(1);
    condition.set(false);
    expect(result.get()).toBe(20);
    a.set(2);
    expect(result.get()).toBe(20);
    expect(runs).toBe(2);
  });

  it("菱形依赖只向 effect 暴露一致的最终值", () => {
    const source = signal(1);
    const left = computed(() => source.get() * 2);
    const right = computed(() => source.get() * 3);
    const sum = computed(() => left.get() + right.get());
    const values: number[][] = [];
    const stop = effect(() => {
      values.push([sum.get(), source.get(), left.get()]);
    });
    source.set(2);
    expect(values).toEqual([
      [5, 1, 2],
      [10, 2, 4],
    ]);
    stop();
  });

  it("派生值相等时不重算下游也不重跑 effect", () => {
    const source = signal(0);
    const parity = computed(() => ({ odd: source.get() % 2 }), {
      equals: (a, b) => a.odd === b.odd,
    });
    let runs = 0;
    const label = computed(() => {
      runs++;
      return parity.get().odd ? "odd" : "even";
    });
    const values: string[] = [];
    const stop = effect(() => {
      values.push(label.get());
    });
    source.set(2);
    expect(values).toEqual(["even"]);
    expect(runs).toBe(1);
    source.set(3);
    expect(values).toEqual(["even", "odd"]);
    expect(runs).toBe(2);
    stop();
  });

  it("保持参考库的惰性订阅，在读取变化值时通知", () => {
    const source = signal(1);
    const doubled = computed(() => source.get() * 2);
    const values: number[] = [];
    const stop = doubled.subscribe((value) => values.push(value));
    expect(values).toEqual([]);
    source.set(2);
    expect(values).toEqual([]);
    expect(doubled.get()).toBe(4);
    expect(values).toEqual([4]);
    source.set(3);
    expect(doubled.get()).toBe(6);
    expect(values).toEqual([4, 6]);
    stop();
    source.set(4);
    doubled.get();
    expect(values).toEqual([4, 6]);
  });

  it("首次和后续计算异常都可以恢复", () => {
    const source = signal(1);
    let fail = true;
    const value = computed(() => {
      const current = source.get();
      if (fail) throw new Error("derive");
      return current * 2;
    });
    expect(() => value.get()).toThrow("derive");
    fail = false;
    expect(value.get()).toBe(2);
    fail = true;
    source.set(3);
    expect(() => value.get()).toThrow("derive");
    fail = false;
    expect(value.get()).toBe(6);
  });

  it("异常后恢复外层依赖追踪上下文", () => {
    const source = signal(1);
    const broken = computed(() => {
      throw new Error("derive");
    });
    const values: number[] = [];
    const stop = effect(() => {
      try {
        broken.get();
      } catch {
        /* 外层继续读取。 */
      }
      values.push(source.get());
    });
    source.set(2);
    expect(values).toEqual([1, 2]);
    stop();
  });

  it("检测直接和间接循环依赖", () => {
    const direct = computed((): number => direct.get());
    expect(() => direct.get()).toThrow(/循环/);
    const a = computed((): number => b.get());
    const b = computed((): number => a.get());
    expect(() => a.get()).toThrow(/循环/);
    expect(computed(() => 42).get()).toBe(42);
  });

  it("computed 刷新抛错后，下次信号写入仍能唤醒 effect", () => {
    const source = signal(0);
    const derived = computed(() => {
      const value = source.get();
      if (value === 1) throw new Error("refresh");
      return value * 2;
    });
    const values: number[] = [];
    const stop = effect(() => {
      values.push(derived.get());
    });
    expect(() => source.set(1)).toThrow("refresh");
    source.set(2);
    expect(values).toEqual([0, 4]);
    stop();
  });

  it("effect 捕获派生异常后仍跟踪失败的 computed", () => {
    const source = signal(0);
    const derived = computed(() => {
      const value = source.get();
      if (value === 0) throw new Error("empty");
      return value;
    });
    const values: number[] = [];
    const stop = effect(() => {
      try {
        values.push(derived.get());
      } catch {
        values.push(-1);
      }
    });
    source.set(1);
    expect(values).toEqual([-1, 1]);
    stop();
  });

  it("显式读取使失败的 computed 恢复时也会通知下游", () => {
    let fail = true;
    const derived = computed(() => {
      if (fail) throw new Error("derive");
      return 42;
    });
    const values: number[] = [];
    const stop = effect(() => {
      try {
        values.push(derived.get());
      } catch {
        values.push(-1);
      }
    });
    fail = false;
    expect(derived.get()).toBe(42);
    expect(values).toEqual([-1, 42]);
    stop();
  });
});
