import { createStore, type Middleware } from "@slux/store";
import { afterEach, describe, expect, it, rstest } from "rstack/test";
import { telemetry } from "../src/index.js";
import type { ErrorContext, StateChangeMetadata, SubscriptionMetadata } from "../src/index.js";

type State = { count: number; label: string };
const makeStore = (middleware: Middleware<State>[]) => createStore<State>(() => ({ count: 0, label: "a" }), { middleware });
afterEach(() => {
  rstest.unstubAllGlobals();
  rstest.restoreAllMocks();
});

describe("telemetry", () => {
  it("初始化报告状态与 ISO 时间，更新报告提交前后状态和 partial", () => {
    const changes: StateChangeMetadata<State>[] = [];
    const initialized: unknown[] = [];
    const t = telemetry<State>({
      onInit: (state, meta) => initialized.push(state, meta),
      onStateChange: (meta) => changes.push(meta),
    });
    const store = makeStore([t]);
    store.setState((state) => ({ count: state.count + 1 }));
    expect(initialized[0]).toBe(store.getInitialState());
    expect(initialized[1]).toMatchObject({
      name: "telemetry",
      timestamp: expect.any(String),
    });
    expect(changes[0]).toMatchObject({
      name: "telemetry",
      prevState: { count: 0, label: "a" },
      nextState: { count: 1, label: "a" },
      partial: { count: 1 },
      changeCount: 1,
    });
    expect(new Date(changes[0]!.timestamp).toISOString()).toBe(changes[0]!.timestamp);
    expect(changes[0]!.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("过滤和暂停期间仍累计变更，恢复后继续报告", () => {
    const changes: StateChangeMetadata<State>[] = [];
    const t = telemetry<State>({
      filter: (prev, next, partial) => prev.count !== next.count && partial.count !== undefined,
      onStateChange: (meta) => changes.push(meta),
    });
    const store = makeStore([t]);
    store.setState({ label: "b" });
    t.setEnabled(false);
    store.setState({ count: 1 });
    expect(t.isEnabled()).toBe(false);
    t.setEnabled(true);
    store.setState({ count: 2 });
    expect(changes.map((meta) => meta.changeCount)).toEqual([3]);
    expect(store.get().count).toBe(2);
  });

  it("订阅计数为累计次数，包含暂停期间与已取消订阅", () => {
    const subscriptions: SubscriptionMetadata[] = [];
    const updates: number[] = [];
    const t = telemetry<State>({
      onSubscribe: (meta) => subscriptions.push(meta),
    });
    const store = makeStore([t]);
    const off = store.subscribe((state) => updates.push(state.count));
    store.setState({ count: 1 });
    off();
    t.setEnabled(false);
    store.subscribe(() => {});
    t.setEnabled(true);
    store.subscribe(() => {});
    store.setState({ count: 2 });
    expect(updates).toEqual([1]);
    expect(subscriptions.map((meta) => meta.totalSubscriptions)).toEqual([1, 3]);
  });

  it.each(["onInit", "onStateChange", "onSubscribe", "filter"] as const)("隔离 %s 的错误并报告来源", (source) => {
    const errors: ErrorContext<State>[] = [];
    const error = new Error(source);
    const t = telemetry<State>({
      onStateChange: () => {},
      [source]: () => {
        throw error;
      },
      onError: (context) => errors.push(context),
    });
    const store = makeStore([t]);
    store.subscribe(() => {});
    store.setState({ count: 1 });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ source, error });
    expect(store.get().count).toBe(1);
  });

  it("onError 自身抛错与缺省 onError 都不破坏更新", () => {
    for (const onError of [
      undefined,
      () => {
        throw new Error("error callback");
      },
    ]) {
      const store = makeStore([
        telemetry<State>({
          onStateChange: () => {
            throw new Error("change");
          },
          ...(onError ? { onError } : {}),
        }),
      ]);
      expect(() => store.setState({ count: 1 })).not.toThrow();
      expect(store.get().count).toBe(1);
    }
  });

  it("禁用时跳过初始化与过滤，未配置回调也可更新", () => {
    const calls: string[] = [];
    const t = telemetry<State>({
      onInit: () => {
        calls.push("init");
      },
      filter: () => {
        calls.push("filter");
        return true;
      },
      onStateChange: () => {
        calls.push("change");
      },
      onSubscribe: () => {
        calls.push("subscribe");
      },
    });
    t.setEnabled(false);
    const store = makeStore([t]);
    store.setState({ count: 2 });
    store.subscribe(() => {});
    expect(store.get().count).toBe(2);
    expect(calls).toEqual([]);
    const plain = makeStore([telemetry<State>()]);
    plain.setState({ count: 3 });
    expect(plain.get().count).toBe(3);
  });

  it("使用高精度计时且包含下游中间件实际提交的结果", () => {
    let now = 10.25;
    rstest.stubGlobal("performance", { now: () => now });
    const changes: StateChangeMetadata<State>[] = [];
    const t = telemetry<State>({ onStateChange: (meta) => changes.push(meta) });
    const store = makeStore([
      t,
      {
        name: "transform",
        onSet: (_api, next, partial) => {
          next({ ...partial, count: 8 });
          now = 12.75;
        },
      },
    ]);
    store.setState({ count: 1 });
    expect(changes[0]).toMatchObject({
      nextState: { count: 8 },
      durationMs: 2.5,
    });
  });

  it("没有 performance 时回退到 Date.now", () => {
    rstest.stubGlobal("performance", undefined);
    let now = 20;
    rstest.spyOn(Date, "now").mockImplementation(() => now);
    const changes: StateChangeMetadata<State>[] = [];
    const t = telemetry<State>({ onStateChange: (meta) => changes.push(meta) });
    const store = makeStore([
      t,
      {
        name: "clock",
        onSet: (_api, next, partial) => {
          next(partial);
          now = 24;
        },
      },
    ]);
    store.setState({ count: 1 });
    expect(changes[0]!.durationMs).toBe(4);
  });

  it("下游业务异常向调用者抛出，不包装成遥测错误", () => {
    const changes: StateChangeMetadata<State>[] = [];
    const errors: ErrorContext<State>[] = [];
    const store = makeStore([
      telemetry<State>({
        onStateChange: (meta) => changes.push(meta),
        onError: (context) => errors.push(context),
      }),
      {
        name: "failure",
        onSet: () => {
          throw new Error("business");
        },
      },
    ]);
    expect(() => store.setState({ count: 1 })).toThrow("business");
    expect(changes).toEqual([]);
    expect(errors).toEqual([]);
  });

  it("销毁后重用中间件时重置变更和订阅计数", () => {
    const counts: number[] = [];
    const subscriptions: number[] = [];
    const t = telemetry<State>({
      onStateChange: (meta) => counts.push(meta.changeCount),
      onSubscribe: (meta) => subscriptions.push(meta.totalSubscriptions),
    });
    const a = makeStore([t]);
    a.setState({ count: 1 });
    a.setState({ count: 2 });
    a.subscribe(() => {});
    a.destroy();
    const b = makeStore([t]);
    b.setState({ count: 3 });
    b.subscribe(() => {});
    expect(counts).toEqual([1, 2, 1]);
    expect(subscriptions).toEqual([1, 1]);
  });
});
