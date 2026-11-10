import { batch, signal } from "@slux/core";
import type { MiddlewareAPI } from "@slux/store";
import type { HistoryMiddleware, HistoryOptions } from "./types.js";

export function history<T>(options?: HistoryOptions): HistoryMiddleware<T> {
  const maxDepth = options?.maxDepth ?? 100;
  const past: T[] = [];
  const future: T[] = [];
  const canUndo = signal(false);
  const canRedo = signal(false);
  let api: MiddlewareAPI<T> | undefined;
  let traveling = false;

  function updateSignals(): void {
    batch(() => {
      canUndo.set(past.length > 0);
      canRedo.set(future.length > 0);
    });
  }

  function travel(from: T[], to: T[]): void {
    if (api === undefined || from.length === 0 || traveling) return;
    const currentApi = api;
    const current = currentApi.getState();
    const previous = from[from.length - 1] as T;
    traveling = true;
    try {
      // 经过完整中间件链，让持久化、调试与同步也能看到撤销和重做。
      currentApi.setState(() => previous);
    } finally {
      // 通知中的 clear 或 destroy 会取消这次历史转移。
      if (api !== undefined && from.length > 0 && currentApi.getState() !== current) {
        from.pop();
        to.push(current);
      }
      traveling = false;
      updateSignals();
    }
  }

  function clear(): void {
    past.length = 0;
    future.length = 0;
    updateSignals();
  }

  return {
    name: "history",
    init(middlewareApi) {
      api = middlewareApi;
    },
    onSet(middlewareApi, next, partial) {
      if (traveling) return next(partial);
      const previous = middlewareApi.getState();
      const index = past.length;
      past.push(previous);
      try {
        next(partial);
      } finally {
        // Store 允许后续中间件阻断或拒绝写入，此时不能消费历史。
        if (middlewareApi.getState() === previous) past.splice(index, 1);
        else future.length = 0;
        if (past.length > maxDepth) past.splice(0, past.length - maxDepth);
        updateSignals();
      }
    },
    onDestroy() {
      api = undefined;
      clear();
    },
    undo: () => travel(past, future),
    redo: () => travel(future, past),
    clear,
    canUndo,
    canRedo,
  };
}
