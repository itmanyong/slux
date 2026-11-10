import { batch, computed, createScope, effect, runInScope } from "@slux/core";
import { describe, expect, it } from "rstack/test";
import { createStore } from "../src/index.js";

describe("createStore", () => {
  it("保留初始引用、别名读取与 creator 中的 set/get", () => {
    const store = createStore<{ count: number; doubled: number }>((set, get) => {
      set({ count: 2 });
      set((state) => ({ count: state.count + 1 }));
      return { count: get().count, doubled: get().count * 2 };
    });
    const initial = store.getInitialState();
    expect(store.get()).toBe(initial);
    expect(store.get()).toBe(store.getState());
    expect(initial).toEqual({ count: 3, doubled: 6 });
    store.setState({ count: 4 });
    expect(store.getInitialState()).toBe(initial);
    expect(initial.count).toBe(3);
    expect(store.getState()).toEqual({ count: 4, doubled: 6 });
  });

  it("浅合并保留未更新字段和 action，嵌套对象整体替换", () => {
    type State = {
      count: number;
      user: { name: string; age?: number };
      increment: () => void;
      doubled: () => number;
    };
    const store = createStore<State>((set, get) => ({
      count: 0,
      user: { name: "Alice", age: 20 },
      increment: () => set((state) => ({ count: state.count + 1 })),
      doubled: () => get().count * 2,
    }));
    const initial = store.getState();
    store.setState({ user: { name: "Bob" } });
    store.getState().increment();
    store.getState().increment();
    expect(store.getState().doubled()).toBe(4);
    expect(store.getState().user).toEqual({ name: "Bob" });
    expect(store.getState().increment).toBe(initial.increment);
    expect(initial.user).toEqual({ name: "Alice", age: 20 });
    expect(initial.count).toBe(0);
  });

  it("空更新和相同值更新也产生新引用及通知", () => {
    const store = createStore(() => ({ count: 0 }));
    const seen: [number, number][] = [];
    store.subscribe((state, prev) => seen.push([state.count, prev.count]));
    const initial = store.get();
    store.setState({});
    const next = store.get();
    store.setState({ count: 0 });
    expect(next).not.toBe(initial);
    expect(store.get()).not.toBe(next);
    expect(seen).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });

  it("订阅不立即通知，取消订阅可重复调用", () => {
    const store = createStore(() => ({ count: 0 }));
    const seen: [number, number][] = [];
    const stop = store.subscribe((state, prev) => seen.push([state.count, prev.count]));
    expect(seen).toEqual([]);
    store.setState({ count: 1 });
    store.setState({ count: 2 });
    stop();
    stop();
    store.setState({ count: 3 });
    expect(seen).toEqual([
      [1, 0],
      [2, 1],
    ]);
  });

  it("批处理立即更新读取，但仅通知一次并保留批次前的状态", () => {
    const store = createStore(() => ({ count: 0, name: "a" }));
    const seen: [number, number][] = [];
    store.subscribe((state, prev) => seen.push([state.count, prev.count]));
    batch(() => {
      store.setState({ count: 1 });
      batch(() => store.setState((state) => ({ count: state.count + 1 })));
      store.setState({ name: "b" });
      expect(store.get()).toEqual({ count: 2, name: "b" });
      expect(seen).toEqual([]);
    });
    store.setState({ count: 3 });
    expect(seen).toEqual([
      [2, 0],
      [3, 2],
    ]);
  });

  it("computed 选择器过滤未变化字段，effect 读取会跟踪依赖", () => {
    const store = createStore(() => ({ count: 1, name: "a" }));
    const doubled = computed(() => store.get().count * 2);
    const selected: number[] = [];
    const stopSelected = doubled.subscribe((value) => selected.push(value));
    const names: string[] = [];
    const stopEffect = effect(() => {
      names.push(store.getState().name);
    });
    store.setState({ name: "b" });
    store.setState({ count: 2 });
    expect(doubled.get()).toBe(4);
    expect(selected).toEqual([4]);
    expect(names).toEqual(["a", "b", "b"]);
    stopEffect();
    stopSelected();
  });

  it("嵌入状态的 computed 延迟读取 creator 的 get", () => {
    type State = {
      count: number;
      doubled: ReturnType<typeof computed<number>>;
    };
    const store = createStore<State>((_set, get) => ({
      count: 2,
      doubled: computed(() => get().count * 2),
    }));
    expect(store.get().doubled.get()).toBe(4);
    store.setState({ count: 3 });
    expect(store.get().doubled.get()).toBe(6);
  });

  it("支持异步 action 和组合切片", async () => {
    type State = {
      count: number;
      name: string;
      increment: () => void;
      load: () => Promise<void>;
    };
    const store = createStore<State>((set, get) => ({
      ...{
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      },
      name: "initial",
      load: async () => {
        const name = await Promise.resolve("loaded");
        set({ name, count: get().count + 1 });
      },
    }));
    const loading = store.get().load();
    store.get().increment();
    await loading;
    expect(store.get().count).toBe(2);
    expect(store.get().name).toBe("loaded");
  });

  it("通知期间添加的监听器从下次通知开始，已取消的监听器不执行", () => {
    const store = createStore(() => ({ count: 0 }));
    const seen: string[] = [];
    const late = () => {
      seen.push("late");
    };
    let removeSecond = () => {};
    store.subscribe(() => {
      seen.push("first");
      removeSecond();
      store.subscribe(late);
    });
    removeSecond = store.subscribe(() => {
      seen.push("second");
    });
    store.setState({ count: 1 });
    expect(seen).toEqual(["first"]);
    store.setState({ count: 2 });
    expect(seen).toEqual(["first", "first", "late"]);
  });

  it("重入更新在当前通知结束后派发，前值保持一致", () => {
    const store = createStore(() => ({ count: 0 }));
    const seen: [number, number][] = [];
    store.subscribe((state) => {
      if (state.count === 1) store.setState({ count: 2 });
    });
    store.subscribe((state, prev) => seen.push([state.count, prev.count]));
    store.setState({ count: 1 });
    expect(seen).toEqual([
      [1, 0],
      [2, 1],
    ]);
  });

  it("监听器抛错仍通知剩余监听器，后续更新正常", () => {
    const store = createStore(() => ({ count: 0 }));
    const error = new Error("listener failed");
    const stop = store.subscribe(() => {
      throw error;
    });
    const seen: [number, number][] = [];
    store.subscribe((state, prev) => seen.push([state.count, prev.count]));
    expect(() => store.setState({ count: 1 })).toThrow(error);
    expect(store.get().count).toBe(1);
    stop();
    store.setState({ count: 2 });
    expect(seen).toEqual([
      [1, 0],
      [2, 1],
    ]);
  });

  it("销毁后冻结写入能力并取消尚未派发的通知", () => {
    const store = createStore(() => ({ count: 0 }));
    const seen: number[] = [];
    store.subscribe((state) => seen.push(state.count));
    batch(() => {
      store.setState({ count: 1 });
      store.destroy();
    });
    let updaterCalls = 0;
    store.setState(() => {
      updaterCalls++;
      return { count: 2 };
    });
    store.subscribe((state) => seen.push(state.count))();
    store.destroy();
    expect(store.get().count).toBe(1);
    expect(seen).toEqual([]);
    expect(updaterCalls).toBe(0);
  });

  it("监听器内销毁可停止当前轮剩余通知", () => {
    const store = createStore(() => ({ count: 0 }));
    const seen: number[] = [];
    store.subscribe(() => store.destroy());
    store.subscribe((state) => seen.push(state.count));
    store.setState({ count: 1 });
    expect(seen).toEqual([]);
  });

  it("遵循 core 的显式 scope 读取，runInScope 不隔离 Store 写入", () => {
    const store = createStore(() => ({ count: 0 }));
    const scope = createScope();
    expect(scope.get(store)).toBe(store.get());
    runInScope(scope, () => store.setState({ count: 1 }));
    expect(scope.get(store).count).toBe(1);
    expect(scope.fork().get(store).count).toBe(1);
    expect(store.get().count).toBe(1);
    expect(scope.serialize()).toEqual({});
  });
});
