import { describe, expect, it } from "rstack/test";
import { signal } from "../../src/reactivity/signal.js";
import { effect } from "../../src/reactivity/effect.js";
import { batch } from "../../src/reactivity/batch.js";
import { createNotifier } from "../../src/runtime/notification.js";

describe("runtime/notification", () => {
  it("通知合并后读取最终值，取消订阅会阻止待执行回调", () => {
    let value = 0;
    let reads = 0;
    const notifier = createNotifier(() => {
      reads++;
      return value;
    });
    const values: number[] = [];
    const removed: number[] = [];
    notifier.subscribe((next) => values.push(next));
    const unsubscribe = notifier.subscribe((next) => removed.push(next));
    expect(values).toEqual([]);

    batch(() => {
      value = 1;
      notifier.notify();
      value = 2;
      notifier.notify();
      unsubscribe();
      expect(reads).toBe(0);
    });

    expect(reads).toBe(1);
    expect(values).toEqual([2]);
    expect(removed).toEqual([]);
  });

  it("订阅回调中的读取不会变成外层 effect 的依赖", () => {
    const source = signal(0);
    const unrelated = signal(0);
    const trigger = signal(0);
    source.subscribe(() => {
      unrelated.get();
    });
    let runs = 0;
    const stop = effect(() => {
      runs++;
      source.set(trigger.get());
    });
    trigger.set(1);
    unrelated.set(1);
    expect(runs).toBe(2);
    stop();
  });

  it("通知异常不会饿死其他回调或使后续调度失效", () => {
    const source = signal(0);
    const stopBad = source.subscribe(() => {
      throw new Error("listener");
    });
    const values: number[] = [];
    source.subscribe((value) => values.push(value));
    const effects: number[] = [];
    const stop = effect(() => {
      effects.push(source.get());
    });
    expect(() => source.set(1)).toThrow("listener");
    expect(values).toEqual([1]);
    expect(effects).toEqual([0, 1]);
    stopBad();
    source.set(2);
    expect(values).toEqual([1, 2]);
    expect(effects).toEqual([0, 1, 2]);
    stop();
  });

  it("通知快照不调用已取消的回调，也不立即调用新增回调", () => {
    const source = signal(0);
    const values: string[] = [];
    let unsubscribe = () => {};
    source.subscribe(() => {
      values.push("first");
      unsubscribe();
      source.subscribe((value) => {
        values.push(`late:${value}`);
      });
    });
    unsubscribe = source.subscribe(() => {
      values.push("removed");
    });
    source.set(1);
    expect(values).toEqual(["first"]);
    source.set(2);
    expect(values).toEqual(["first", "first", "late:2"]);
  });
});
