import { describe, expect, it } from "rstack/test";
import { signal } from "../../src/reactivity/signal.js";
import { effect } from "../../src/reactivity/effect.js";
import { batch } from "../../src/reactivity/batch.js";

describe("reactivity/batch", () => {
  it("批处理嵌套合并通知，内部读取立即可见", () => {
    const a = signal(1);
    const b = signal(2);
    const sums: number[] = [];
    const changes: number[] = [];
    const stop = effect(() => {
      sums.push(a.get() + b.get());
    });
    a.subscribe((value) => changes.push(value));
    expect(
      batch(() => {
        a.set(10);
        batch(() => {
          a.set(20);
          b.set(30);
        });
        expect(a.get()).toBe(20);
        expect(sums).toEqual([3]);
        expect(changes).toEqual([]);
        return "done";
      }),
    ).toBe("done");
    expect(sums).toEqual([3, 50]);
    expect(changes).toEqual([20]);
    stop();
  });

  it("批处理函数异常也提交之前的写入并恢复调度", () => {
    const source = signal(0);
    const values: number[] = [];
    const stop = effect(() => {
      values.push(source.get());
    });
    expect(() =>
      batch(() => {
        source.set(1);
        throw new Error("batch");
      }),
    ).toThrow("batch");
    source.set(2);
    expect(values).toEqual([0, 1, 2]);
    stop();
  });

  it("批处理中释放 effect 和订阅会取消待执行回调", () => {
    const source = signal(0);
    const effects: number[] = [];
    const notifications: number[] = [];
    const stop = effect(() => {
      effects.push(source.get());
    });
    const unsubscribe = source.subscribe((value) => notifications.push(value));
    batch(() => {
      source.set(1);
      stop();
      unsubscribe();
    });
    expect(effects).toEqual([0]);
    expect(notifications).toEqual([]);
  });
});
