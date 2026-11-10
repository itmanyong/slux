import { describe, expect, it } from "rstack/test";
import { createStore, type Middleware, type MiddlewareAPI, type SetFn } from "../src/index.js";

type State = { count: number };

describe("middleware", () => {
  it("按数组顺序进入 onSet、逆序退出，updater 已解析", () => {
    const order: string[] = [];
    const middleware: Middleware<State>[] = ["first", "second"].map((name) => ({
      name,
      onSet: (api, next, partial) => {
        order.push(`${name}:${api.getState().count}`);
        expect(partial).toEqual({ count: 1 });
        next(partial);
        order.push(`${name}:${api.getState().count}`);
      },
    }));
    const store = createStore(() => ({ count: 0 }), { middleware });
    store.setState((state) => ({ count: state.count + 1 }));
    expect(order).toEqual(["first:0", "second:0", "second:1", "first:1"]);
  });

  it("中间件可以转换部分状态或阻断更新", () => {
    const store = createStore(() => ({ count: 0 }), {
      middleware: [
        {
          name: "positive-doubler",
          onSet: (_api, next, partial) => {
            if (partial.count !== undefined && partial.count >= 0) {
              next({ count: partial.count * 2 });
            }
          },
        },
      ],
    });
    store.setState({ count: 3 });
    expect(store.get().count).toBe(6);
    store.setState({ count: -1 });
    expect(store.get().count).toBe(6);
  });

  it("creator 中的 set 绕过中间件，action 和 init 更新经过完整链", () => {
    const seen: number[] = [];
    type Counter = State & { increment: () => void };
    const store = createStore<Counter>(
      (set, get) => {
        set({ count: 1 });
        return {
          count: get().count,
          increment: () => set((state) => ({ count: state.count + 1 })),
        };
      },
      {
        middleware: [
          {
            name: "hydrate",
            init: (api) => {
              expect(api.getInitialState().count).toBe(1);
              api.subscribe((state) => seen.push(state.count));
              api.setState({ count: 10 });
            },
            onSet: (_api, next, partial) => {
              seen.push(-1);
              next(partial);
            },
          },
        ],
      },
    );
    store.get().increment();
    expect(seen).toEqual([-1, 10, -1, 11]);
    expect(store.getInitialState().count).toBe(1);
  });

  it("onSubscribe 逆序构建包装器，通知时第一个中间件在最外层", () => {
    const order: string[] = [];
    const middleware: Middleware<State>[] = ["first", "second"].map((name) => ({
      name,
      onSubscribe: (_api, listener) => {
        order.push(`wrap:${name}`);
        return (state, prev) => {
          order.push(`notify:${name}`);
          listener({ count: name === "first" ? state.count + 1 : state.count * 2 }, prev);
        };
      },
    }));
    const store = createStore(() => ({ count: 0 }), { middleware });
    const seen: [number, number][] = [];
    const stop = store.subscribe((state, prev) => seen.push([state.count, prev.count]));
    store.setState({ count: 5 });
    stop();
    store.setState({ count: 6 });
    expect(order).toEqual(["wrap:second", "wrap:first", "notify:first", "notify:second"]);
    expect(seen).toEqual([[12, 0]]);
    expect(store.get().count).toBe(6);
  });

  it("空钩子可用，onGet 保留但不会调用", () => {
    const store = createStore(() => ({ count: 0 }), {
      middleware: [
        { name: "empty" },
        {
          name: "reserved",
          onGet: () => {
            throw new Error("must not run");
          },
        },
      ],
    });
    store.setState({ count: 1 });
    expect(store.get().count).toBe(1);
    store.destroy();
  });

  it("写入前的错误不提交状态，写入后的错误不回滚状态", () => {
    const error = new Error("write failed");
    let after = false;
    const store = createStore(() => ({ count: 0 }), {
      middleware: [
        {
          name: "throw",
          onSet: (_api, next, partial) => {
            if (after) next(partial);
            throw error;
          },
        },
      ],
    });
    expect(() => store.setState({ count: 1 })).toThrow(error);
    expect(store.get().count).toBe(0);
    after = true;
    expect(() => store.setState({ count: 2 })).toThrow(error);
    expect(store.get().count).toBe(2);
  });

  it("updater 抛错时不进入中间件，状态保持不变", () => {
    const calls: number[] = [];
    const store = createStore(() => ({ count: 0 }), {
      middleware: [
        {
          name: "track",
          onSet: (_api, next, partial) => {
            calls.push(1);
            next(partial);
          },
        },
      ],
    });
    expect(() =>
      store.setState(() => {
        throw new Error("updater");
      }),
    ).toThrow("updater");
    expect(store.get().count).toBe(0);
    expect(calls).toEqual([]);
  });

  it("onSubscribe 抛错时不残留订阅", () => {
    const calls: number[] = [];
    const store = createStore(() => ({ count: 0 }), {
      middleware: [
        {
          name: "throw",
          onSubscribe: () => {
            throw new Error("subscribe");
          },
        },
      ],
    });
    expect(() => store.subscribe(() => calls.push(1))).toThrow("subscribe");
    store.setState({ count: 1 });
    expect(calls).toEqual([]);
  });

  it("销毁按顺序执行全部钩子，即使其中一个抛错也完成清理", () => {
    const calls: string[] = [];
    const error = new Error("cleanup failed");
    const store = createStore(() => ({ count: 0 }), {
      middleware: [
        {
          name: "first",
          onDestroy: () => {
            calls.push("first");
            throw error;
          },
        },
        {
          name: "second",
          onDestroy: (api) => {
            calls.push("second");
            api.setState({ count: 99 });
          },
        },
      ],
    });
    store.subscribe(() => calls.push("notification"));
    expect(() => store.destroy()).toThrow(error);
    store.destroy();
    store.setState({ count: 1 });
    expect(calls).toEqual(["first", "second"]);
    expect(store.get().count).toBe(0);
  });

  it("多个销毁错误以 AggregateError 保留", () => {
    const errors = [new Error("a"), new Error("b")];
    const store = createStore(() => ({ count: 0 }), {
      middleware: errors.map((error) => ({
        name: error.message,
        onDestroy: () => {
          throw error;
        },
      })),
    });
    try {
      store.destroy();
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateError);
      expect((error as AggregateError).errors).toEqual(errors);
    }
  });

  it("init 失败时清理已进入的中间件并关闭泄露的 API", () => {
    const calls: string[] = [];
    let captured: MiddlewareAPI<State> | undefined;
    const failure = new Error("init failed");
    expect(() =>
      createStore(() => ({ count: 0 }), {
        middleware: [
          {
            name: "first",
            init: (api) => {
              captured = api;
              api.subscribe(() => calls.push("notification"));
            },
            onDestroy: () => {
              calls.push("first");
            },
          },
          {
            name: "second",
            init: () => {
              throw failure;
            },
            onDestroy: () => {
              calls.push("second");
            },
          },
          {
            name: "third",
            init: () => {
              calls.push("third:init");
            },
            onDestroy: () => {
              calls.push("third:destroy");
            },
          },
        ],
      }),
    ).toThrow(failure);
    captured?.setState({ count: 1 });
    expect(captured?.getState().count).toBe(0);
    expect(calls).toEqual(["first", "second"]);
  });

  it("初始化和清理同时失败时保留两个错误", () => {
    const initError = new Error("init");
    const destroyError = new Error("destroy");
    try {
      createStore(() => ({ count: 0 }), {
        middleware: [
          {
            name: "failure",
            init: () => {
              throw initError;
            },
            onDestroy: () => {
              throw destroyError;
            },
          },
        ],
      });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateError);
      expect((error as AggregateError).errors).toEqual([initError, destroyError]);
    }
  });

  it("销毁后中间件保存的 next 不能继续写入", () => {
    let saved: SetFn<State> | undefined;
    const store = createStore(() => ({ count: 0 }), {
      middleware: [
        {
          name: "deferred",
          onSet: (_api, next) => {
            saved = next;
          },
        },
      ],
    });
    store.setState({ count: 1 });
    store.destroy();
    saved?.({ count: 2 });
    expect(store.get().count).toBe(0);
  });
});
