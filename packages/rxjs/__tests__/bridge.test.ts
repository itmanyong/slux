import { describe, expect, it } from "rstack/test";
import { batch, computed, effect, signal } from "@slux/core";
import type { Subscribable } from "@slux/core";
import { EMPTY, Observable, Subject, defer, from, of, take, throwError } from "rxjs";
import { fromObservable, toObservable } from "../src/index.js";

describe("toObservable", () => {
  it("每次订阅读取当前值，随后遵守 core 批处理", () => {
    const state = signal(0);
    const values: number[] = [];
    const observable = toObservable(state);
    const subscription = observable.subscribe((value) => values.push(value));
    batch(() => {
      state.set(1);
      state.set(2);
    });
    const later: number[] = [];
    const second = observable.subscribe((value) => later.push(value));
    state.set(3);
    subscription.unsubscribe();
    state.set(4);
    expect(values).toEqual([0, 2, 3]);
    expect(later).toEqual([2, 3, 4]);
    second.unsubscribe();
  });

  it("主动拉取 computed，退订后停止派生计算", () => {
    const count = signal(1);
    let evaluations = 0;
    const doubled = computed(() => {
      evaluations++;
      return count.get() * 2;
    });
    const values: number[] = [];
    const subscription = toObservable(doubled).subscribe((value) => values.push(value));
    count.set(2);
    expect(values).toEqual([2, 4]);
    subscription.unsubscribe();
    const before = evaluations;
    count.set(3);
    expect(evaluations).toBe(before);
  });

  it("take(1) 同步关闭时不建立后续订阅", () => {
    const state = signal(7);
    let connections = 0;
    const source: Subscribable<number> = {
      get: state.get,
      subscribe(callback) {
        connections++;
        return state.subscribe(callback);
      },
    };
    const values: number[] = [];
    const subscription = toObservable(source)
      .pipe(take(1))
      .subscribe((value) => values.push(value));
    expect(subscription.closed).toBe(true);
    expect(values).toEqual([7]);
    expect(connections).toBe(0);
  });

  it("首值回调重入写入时补发最新值", () => {
    const state = signal(0);
    const values: number[] = [];
    const subscription = toObservable(state).subscribe((value) => {
      values.push(value);
      if (value === 0) state.set(1);
    });
    state.set(2);
    expect(values).toEqual([0, 1, 2]);
    subscription.unsubscribe();
  });

  it("订阅连接阶段同步关闭仍清理源订阅", () => {
    let cleaned = 0;
    const source: Subscribable<number> = {
      get: () => 0,
      subscribe(callback) {
        callback(1);
        return () => {
          cleaned++;
        };
      },
    };
    const values: number[] = [];
    toObservable(source)
      .pipe(take(2))
      .subscribe((value) => values.push(value));
    expect(values).toEqual([0, 1]);
    expect(cleaned).toBe(1);
  });

  it("派生读取异常进入 RxJS error 通道并清理 effect", () => {
    const count = signal(0);
    const failure = new Error("派生失败");
    let evaluations = 0;
    const source = computed(() => {
      evaluations++;
      if (count.get() > 0) throw failure;
      return 0;
    });
    const errors: unknown[] = [];
    const subscription = toObservable(source).subscribe({
      error: (error) => errors.push(error),
    });
    expect(() => count.set(1)).not.toThrow();
    expect(errors).toEqual([failure]);
    expect(subscription.closed).toBe(true);
    const before = evaluations;
    count.set(2);
    expect(evaluations).toBe(before);
  });

  it("首次读取异常进入 RxJS error 通道", () => {
    const failure = new Error("首次失败");
    const errors: unknown[] = [];
    toObservable(
      computed(() => {
        throw failure;
      }),
    ).subscribe({ error: (error) => errors.push(error) });
    expect(errors).toEqual([failure]);
  });
});

describe("fromObservable", () => {
  it("创建时消费同步冷源，保留最后值和完成状态", () => {
    let connections = 0;
    const state = fromObservable(
      defer(() => {
        connections++;
        return of(1, 2);
      }),
      0,
    );
    const values: number[] = [];
    const unsubscribe = state.subscribe((value) => values.push(value));
    expect(state.get()).toBe(2);
    expect(state.status.get()).toBe("complete");
    expect(state.error.get()).toBeUndefined();
    expect(values).toEqual([]);
    unsubscribe();
    const unsubscribeAgain = state.subscribe(() => {});
    expect(connections).toBe(1);
    unsubscribeAgain();
    state.dispose();
  });

  it("EMPTY 保留初始值并完成", () => {
    const state = fromObservable(EMPTY, "initial");
    expect(state.get()).toBe("initial");
    expect(state.status.get()).toBe("complete");
    state.dispose();
  });

  it("记录同步错误并保留初始值", () => {
    const failure = new Error("同步失败");
    const state = fromObservable(
      throwError(() => failure),
      4,
    );
    expect(state.get()).toBe(4);
    expect(state.status.get()).toBe("error");
    expect(state.error.get()).toBe(failure);
    state.dispose();
  });

  it("热源值支持 core effect 与 computed，批处理只发送最终值", () => {
    const subject = new Subject<number>();
    const state = fromObservable(subject, 0);
    const doubled = computed(() => state.get() * 2);
    const values: number[] = [];
    const notifications: number[] = [];
    const stop = effect(() => {
      values.push(doubled.get());
    });
    const unsubscribe = state.subscribe((value) => notifications.push(value));
    batch(() => {
      subject.next(1);
      subject.next(2);
    });
    expect(state.get()).toBe(2);
    expect(values).toEqual([0, 4]);
    expect(notifications).toEqual([2]);
    unsubscribe();
    subject.next(3);
    expect(values).toEqual([0, 4, 6]);
    stop();
    state.dispose();
  });

  it("消费者分别退订不会销毁共享桥接", () => {
    let cleaned = 0;
    const subject = new Subject<number>();
    const source = new Observable<number>((subscriber) => {
      const subscription = subject.subscribe(subscriber);
      return () => {
        cleaned++;
        subscription.unsubscribe();
      };
    });
    const state = fromObservable(source, 0);
    const first: number[] = [];
    const second: number[] = [];
    const stopFirst = state.subscribe((value) => first.push(value));
    const stopSecond = state.subscribe((value) => second.push(value));
    subject.next(1);
    stopFirst();
    subject.next(2);
    stopSecond();
    subject.next(3);
    expect(first).toEqual([1]);
    expect(second).toEqual([1, 2]);
    expect(state.get()).toBe(3);
    expect(cleaned).toBe(0);
    state.dispose();
    state.dispose();
    subject.next(4);
    expect(cleaned).toBe(1);
    expect(state.get()).toBe(3);
    expect(state.status.get()).toBe("disposed");
  });

  it("异步源首值前使用初始值，完成后保留结果", async () => {
    const state = fromObservable(from(Promise.resolve(42)), 0);
    const values: number[] = [];
    const unsubscribe = state.subscribe((value) => values.push(value));
    expect(state.get()).toBe(0);
    expect(state.status.get()).toBe("active");
    await Promise.resolve();
    expect(values).toEqual([42]);
    expect(state.get()).toBe(42);
    expect(state.status.get()).toBe("complete");
    unsubscribe();
    state.dispose();
  });

  it("异步结果到达前销毁会阻止后续更新", async () => {
    const state = fromObservable(from(Promise.resolve(42)), 0);
    state.dispose();
    await Promise.resolve();
    expect(state.get()).toBe(0);
    expect(state.status.get()).toBe("disposed");
  });

  it("错误状态与错误值在同一批次可观察，最后值保持可读", () => {
    const subject = new Subject<number>();
    const failure = new Error("后续失败");
    const state = fromObservable(subject, 0);
    const seen: unknown[][] = [];
    const stop = effect(() => {
      seen.push([state.status.get(), state.error.get()]);
    });
    subject.next(5);
    subject.error(failure);
    subject.next(6);
    expect(state.get()).toBe(5);
    expect(seen).toEqual([
      ["active", undefined],
      ["error", failure],
    ]);
    state.dispose();
    expect(state.error.get()).toBe(failure);
    expect(state.status.get()).toBe("disposed");
    stop();
  });

  it("函数值不会当作 recipe 执行，undefined 可以替换已有值", () => {
    const initial = () => 1;
    const next = () => 2;
    const subject = new Subject<(() => number) | undefined>();
    const state = fromObservable<(() => number) | undefined>(subject, initial);
    subject.next(next);
    expect(state.get()).toBe(next);
    subject.next(undefined);
    expect(state.get()).toBeUndefined();
    state.dispose();
  });

  it("函数与 undefined 错误值均由状态明确标识", () => {
    const failure = () => "failure";
    const functionError = fromObservable(
      throwError(() => failure),
      0,
    );
    const undefinedError = fromObservable(
      throwError(() => undefined),
      0,
    );
    expect(functionError.error.get()).toBe(failure);
    expect(undefinedError.status.get()).toBe("error");
    expect(undefinedError.error.get()).toBeUndefined();
    functionError.dispose();
    undefinedError.dispose();
  });
});
