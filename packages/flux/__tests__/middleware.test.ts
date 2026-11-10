import { describe, expect, it } from "rstack/test";
import { createFluxStore, type FluxDispatch, type FluxMiddleware } from "../src/index.js";

type Action = { type: "add"; amount: number };
const reducer = (state: number, action: Action) => state + action.amount;

describe("Flux middleware", () => {
  it("按照数组顺序嵌套执行并读取更新前后状态", () => {
    const seen: string[] = [];
    const first: FluxMiddleware<number, Action> = (api) => (next) => (action) => {
      seen.push(`first:before:${api.getState()}`);
      const result = next(action);
      seen.push(`first:after:${api.getState()}`);
      return result;
    };
    const second: FluxMiddleware<number, Action> = (api) => (next) => (action) => {
      seen.push(`second:before:${api.getState()}`);
      const result = next(action);
      seen.push(`second:after:${api.getState()}`);
      return result;
    };
    const store = createFluxStore(reducer, 0, { middleware: [first, second] });
    const action: Action = { type: "add", amount: 2 };
    expect(store.dispatch(action)).toBe(action);
    expect(seen).toEqual(["first:before:0", "second:before:0", "second:after:2", "first:after:2"]);
  });

  it("中间件可以替换 action 或阻止提交", () => {
    const filter: FluxMiddleware<number, Action> = () => (next) => (action) => {
      if (action.amount < 0) return action;
      return next({ ...action, amount: action.amount * 2 });
    };
    const store = createFluxStore(reducer, 0, { middleware: [filter] });
    expect(store.dispatch({ type: "add", amount: 2 })).toEqual({
      type: "add",
      amount: 4,
    });
    store.dispatch({ type: "add", amount: -10 });
    expect(store.get()).toBe(4);
  });

  it("api.dispatch 始终进入完整管道", () => {
    const seen: number[] = [];
    const follow: FluxMiddleware<number, Action> = (api) => (next) => (action) => {
      seen.push(action.amount);
      const result = next(action);
      if (action.amount === 1) api.dispatch({ type: "add", amount: 2 });
      return result;
    };
    const store = createFluxStore(reducer, 0, { middleware: [follow] });
    store.dispatch({ type: "add", amount: 1 });
    expect(seen).toEqual([1, 2]);
    expect(store.get()).toBe(3);
  });

  it("禁止中间件初始化期间 dispatch，避免绕过未完成的管道", () => {
    const invalid: FluxMiddleware<number, Action> = (api) => {
      api.dispatch({ type: "add", amount: 1 });
      return (next) => next;
    };
    expect(() => createFluxStore(reducer, 0, { middleware: [invalid] })).toThrow("Cannot dispatch while middleware is initializing");
  });

  it("destroy 后公共 dispatch 和保留的 next 都不会提交", () => {
    let retained: FluxDispatch<Action> | undefined;
    let calls = 0;
    const middleware: FluxMiddleware<number, Action> = () => (next) => {
      retained = next;
      return (action) => {
        calls++;
        return next(action);
      };
    };
    const store = createFluxStore(reducer, 0, { middleware: [middleware] });
    store.destroy();
    const action: Action = { type: "add", amount: 1 };
    expect(store.dispatch(action)).toBe(action);
    expect(retained?.(action)).toBe(action);
    expect(calls).toBe(0);
    expect(store.get()).toBe(0);
  });

  it("中间件抛错保持错误可见，之后仍可 dispatch", () => {
    const failure = new Error("middleware failed");
    const middleware: FluxMiddleware<number, Action> = () => (next) => (action) => {
      if (action.amount < 0) throw failure;
      return next(action);
    };
    const store = createFluxStore(reducer, 0, { middleware: [middleware] });
    expect(() => store.dispatch({ type: "add", amount: -1 })).toThrow(failure);
    expect(store.get()).toBe(0);
    store.dispatch({ type: "add", amount: 2 });
    expect(store.get()).toBe(2);
  });
});
