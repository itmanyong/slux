import type { ReadonlySignal } from "@slux/core";
import type { Middleware } from "@slux/store";
import { history, type HistoryMiddleware } from "../src/index.js";

export function checkTypes(): void {
  const h: HistoryMiddleware<{ count: number }> = history<{ count: number }>({
    maxDepth: 5,
  });
  const middleware: Middleware<{ count: number }> = h;
  const available: ReadonlySignal<boolean> = h.canUndo;
  // @ts-expect-error 历史可用状态不能由外部写入。
  h.canUndo.set(true);
  // @ts-expect-error 最大深度必须是数字。
  history({ maxDepth: "5" });
  void [middleware, available];
}
