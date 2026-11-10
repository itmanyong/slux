import { batch, computed, effect, signal } from "@slux/core";
import { describe, expect, it } from "rstack/test";
import { createFluxStore, type FluxStore } from "../src/index.js";

type Action = { type: "add"; amount: number } | { type: "reset" };
const reducer = (state: number, action: Action) => (action.type === "add" ? state + action.amount : 0);

describe("createFluxStore", () => {
  it("初始化不派发虚构 action，并保留初始引用和读取别名", () => {
    const initial = { count: 0, label: "initial" };
    let calls = 0;
    const store = createFluxStore((state: typeof initial, _action: Action) => {
      calls++;
      return { ...state, count: state.count + 1 };
    }, initial);
    expect(calls).toBe(0);
    expect(store.get()).toBe(initial);
    expect(store.getState()).toBe(initial);
    const action: Action = { type: "add", amount: 1 };
    expect(store.dispatch(action)).toBe(action);
    expect(store.get()).toEqual({ count: 1, label: "initial" });
    expect(store.getInitialState()).toBe(initial);
    expect(initial.count).toBe(0);
  });

  it("reducer 返回完整替换状态，不合并旧字段", () => {
    type State = { count: number; label?: string };
    const next: State = { count: 1 };
    const store = createFluxStore((_state: State, _action: Action) => next, {
      count: 0,
      label: "old",
    });
    store.dispatch({ type: "reset" });
    expect(store.get()).toBe(next);
    expect(store.get()).not.toHaveProperty("label");
  });

  it("Object.is 相同状态不通知，区分正负零并稳定处理 NaN", () => {
    const store = createFluxStore((_state: number, action: { type: "set"; value: number }) => action.value, NaN);
    const seen: number[] = [];
    store.subscribe((state) => seen.push(state));
    store.dispatch({ type: "set", value: NaN });
    store.dispatch({ type: "set", value: 0 });
    store.dispatch({ type: "set", value: -0 });
    store.dispatch({ type: "set", value: -0 });
    expect(seen).toEqual([0, -0]);
    const object = {};
    const same = createFluxStore((state: object, _action: Action) => state, object);
    let calls = 0;
    same.subscribe(() => calls++);
    same.dispatch({ type: "reset" });
    expect(calls).toBe(0);
  });

  it("函数作为状态保存，undefined 可以作为替换状态", () => {
    let calls = 0;
    const initial = () => 1;
    const next = () => {
      calls++;
      return 2;
    };
    const store = createFluxStore((_state: () => number, _action: Action) => next, initial);
    store.dispatch({ type: "reset" });
    expect(store.get()).toBe(next);
    expect(store.getInitialState()).toBe(initial);
    expect(calls).toBe(0);
    const optional = createFluxStore((_state: string | undefined, _action: Action) => undefined, "initial");
    optional.dispatch({ type: "reset" });
    expect(optional.get()).toBeUndefined();
  });

  it("订阅不立即执行，取消订阅幂等", () => {
    const store = createFluxStore(reducer, 0);
    const seen: number[] = [];
    const stop = store.subscribe((value) => seen.push(value));
    expect(seen).toEqual([]);
    store.dispatch({ type: "add", amount: 2 });
    stop();
    stop();
    store.dispatch({ type: "add", amount: 3 });
    expect(seen).toEqual([2]);
    expect(store.get()).toBe(5);
  });

  it("复用 core 批处理，批内读取最新状态且只通知最终值", () => {
    const store = createFluxStore(reducer, 0);
    const seen: number[] = [];
    store.subscribe((state) => seen.push(state));
    batch(() => {
      store.dispatch({ type: "add", amount: 1 });
      batch(() => store.dispatch({ type: "add", amount: 2 }));
      expect(store.get()).toBe(3);
      expect(seen).toEqual([]);
    });
    expect(seen).toEqual([3]);
  });

  it("get 和 getState 都参与 computed 与 effect 的真实依赖跟踪", () => {
    const store = createFluxStore(reducer, 1);
    const doubled = computed(() => store.get() * 2);
    const selected: number[] = [];
    const stopSelected = doubled.subscribe((value) => selected.push(value));
    const seen: number[] = [];
    const stopEffect = effect(() => {
      seen.push(store.getState());
    });
    store.dispatch({ type: "add", amount: 2 });
    expect(doubled.get()).toBe(6);
    expect(selected).toEqual([6]);
    expect(seen).toEqual([1, 3]);
    stopSelected();
    stopEffect();
  });

  it("reducer 抛错不提交，并可继续派发", () => {
    const failure = new Error("reducer failed");
    const store = createFluxStore((state: number, action: Action) => {
      if (action.type === "reset") throw failure;
      return state + action.amount;
    }, 1);
    const seen: number[] = [];
    store.subscribe((value) => seen.push(value));
    expect(() => store.dispatch({ type: "reset" })).toThrow(failure);
    expect(store.get()).toBe(1);
    expect(seen).toEqual([]);
    store.dispatch({ type: "add", amount: 2 });
    expect(seen).toEqual([3]);
  });

  it("effect 中仅 dispatch 不会订阅 Flux 状态", () => {
    const trigger = signal(0);
    const store = createFluxStore(reducer, 0);
    let runs = 0;
    const stop = effect(() => {
      trigger.get();
      runs++;
      store.dispatch({ type: "add", amount: 1 });
    });
    expect(runs).toBe(1);
    store.dispatch({ type: "add", amount: 1 });
    expect(runs).toBe(1);
    trigger.set(1);
    expect(runs).toBe(2);
    expect(store.get()).toBe(3);
    stop();
  });

  it("禁止 reducer 递归 dispatch，失败后恢复调度", () => {
    const store: FluxStore<number, Action> = createFluxStore((state: number, action: Action) => {
      if (action.type === "reset") store.dispatch({ type: "add", amount: 100 });
      return reducer(state, action);
    }, 0);
    expect(() => store.dispatch({ type: "reset" })).toThrow("Cannot dispatch while the reducer is executing");
    expect(store.get()).toBe(0);
    store.dispatch({ type: "add", amount: 1 });
    expect(store.get()).toBe(1);
  });

  it("监听器可以再次 dispatch，当前通知快照保持一致", () => {
    const store = createFluxStore(reducer, 0);
    const seen: number[] = [];
    store.subscribe((state) => {
      if (state === 1) store.dispatch({ type: "add", amount: 1 });
    });
    store.subscribe((state) => seen.push(state));
    store.dispatch({ type: "add", amount: 1 });
    expect(seen).toEqual([1, 2]);
  });

  it("监听器抛错不阻断其他监听器或回滚已提交状态", () => {
    const store = createFluxStore(reducer, 0);
    const failure = new Error("listener failed");
    const stop = store.subscribe(() => {
      throw failure;
    });
    const seen: number[] = [];
    store.subscribe((state) => seen.push(state));
    expect(() => store.dispatch({ type: "add", amount: 1 })).toThrow(failure);
    expect(store.get()).toBe(1);
    stop();
    store.dispatch({ type: "add", amount: 1 });
    expect(seen).toEqual([1, 2]);
  });

  it("destroy 清除批内待派发通知，之后订阅和 dispatch 均无副作用", () => {
    const store = createFluxStore(reducer, 0);
    const seen: number[] = [];
    store.subscribe((state) => seen.push(state));
    batch(() => {
      store.dispatch({ type: "add", amount: 1 });
      store.destroy();
    });
    store.destroy();
    store.subscribe((state) => seen.push(state))();
    const action: Action = { type: "add", amount: 10 };
    expect(store.dispatch(action)).toBe(action);
    expect(store.get()).toBe(1);
    expect(store.getInitialState()).toBe(0);
    expect(seen).toEqual([]);
  });

  it("监听器内 destroy 可终止本轮余下通知", () => {
    const store = createFluxStore(reducer, 0);
    const seen: number[] = [];
    store.subscribe(() => store.destroy());
    store.subscribe((state) => seen.push(state));
    store.dispatch({ type: "add", amount: 1 });
    expect(seen).toEqual([]);
  });
});
