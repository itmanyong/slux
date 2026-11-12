import { describe, expect, it } from "rstack/test";
import { effect } from "@slux/core";
import { createStore, type Middleware } from "@slux/store";
import { history } from "../src/index.js";

describe("history 与 Store 生命周期", () => {
  it("撤销通知中的 clear 不会被恢复成重做记录", () => {
    const h = history<{ count: number }>();
    const store = createStore(() => ({ count: 0 }), { middleware: [h] });
    store.setState({ count: 1 });
    store.subscribe(() => h.clear());
    h.undo();
    expect(store.getState().count).toBe(0);
    expect(h.canUndo.get()).toBe(false);
    expect(h.canRedo.get()).toBe(false);
    h.redo();
    expect(store.getState().count).toBe(0);
    store.destroy();
  });

  it("被后续中间件阻止的更新不产生可撤销记录", () => {
    const h = history<{ count: number }>();
    const store = createStore(() => ({ count: 0 }), {
      middleware: [h, { name: "block", onSet() {} }],
    });
    store.setState({ count: 1 });
    expect(store.getState().count).toBe(0);
    expect(h.canUndo.get()).toBe(false);
  });

  it("撤销被阻止后仍可再次撤销", () => {
    let blocked = false;
    const h = history<{ count: number }>();
    const store = createStore(() => ({ count: 0 }), {
      middleware: [
        h,
        {
          name: "block",
          onSet: (_api, next, partial) => {
            if (!blocked) next(partial);
          },
        },
      ],
    });
    store.setState({ count: 1 });
    blocked = true;
    h.undo();
    expect(h.canUndo.get()).toBe(true);
    expect(h.canRedo.get()).toBe(false);
    blocked = false;
    h.undo();
    expect(store.getState().count).toBe(0);
  });

  it("写入前抛错不清空已有重做记录", () => {
    let fail = false;
    const h = history<{ count: number }>();
    const middleware: Middleware<{ count: number }> = {
      name: "fail",
      onSet: (_api, next, partial) => {
        if (fail) throw new Error("before commit");
        next(partial);
      },
    };
    const store = createStore(() => ({ count: 0 }), {
      middleware: [h, middleware],
    });
    store.setState({ count: 1 });
    h.undo();
    fail = true;
    expect(() => store.setState({ count: 2 })).toThrow("before commit");
    expect(h.canUndo.get()).toBe(false);
    expect(h.canRedo.get()).toBe(true);
    fail = false;
    h.redo();
    expect(store.getState().count).toBe(1);
  });

  it("两个可用信号在一次批次中更新", () => {
    const h = history<{ count: number }>();
    const store = createStore(() => ({ count: 0 }), { middleware: [h] });
    store.setState({ count: 1 });
    const seen: string[] = [];
    const stop = effect(() => {
      seen.push(`${h.canUndo.get()}:${h.canRedo.get()}`);
    });
    h.undo();
    expect(seen).toEqual(["true:false", "false:true"]);
    stop();
    store.destroy();
  });

  it("maxDepth 为零不记录历史且动作函数保持可用", () => {
    const h = history<{ count: number; increment: () => void }>({
      maxDepth: 0,
    });
    const store = createStore((set) => ({ count: 0, increment: () => set({ count: 1 }) }), { middleware: [h] });
    store.getState().increment();
    h.undo();
    expect(store.getState().count).toBe(1);
    expect(h.canUndo.get()).toBe(false);
  });
});
