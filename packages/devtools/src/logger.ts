import type { LoggerMiddleware, LoggerOptions, LoggerInterface, MiddlewareAPI, SetFn } from "./types.js";
import { deriveActionName } from "./utils.js";

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  return `${h}:${m}:${s}.${ms}`;
}

function shallowDiff(prev: Record<string, unknown>, next: Record<string, unknown>): Record<string, { prev: unknown; next: unknown }> {
  const diff: Record<string, { prev: unknown; next: unknown }> = {};
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  for (const key of allKeys) {
    if (prev[key] !== next[key]) {
      diff[key] = { prev: prev[key], next: next[key] };
    }
  }
  return diff;
}

export function logger<T>(options?: LoggerOptions): LoggerMiddleware<T> {
  const name = options?.name ?? "Slux";
  const collapsed = options?.collapsed ?? true;
  const showDiff = options?.diff ?? false;
  const enabled = options?.enabled ?? true;
  const log: LoggerInterface = options?.logger ?? console;
  const actionNameFn = options?.actionName;

  return {
    name: "logger",

    onSet(api: MiddlewareAPI<T>, next: SetFn<T>, partial: Partial<T>): void {
      if (!enabled) {
        next(partial);
        return;
      }

      const prevState = api.getState();
      const actionLabel =
        actionNameFn !== undefined ? actionNameFn(partial as Record<string, unknown>) : deriveActionName(partial as Record<string, unknown>);
      const timestamp = formatTime(new Date());

      if (collapsed) {
        log.groupCollapsed(`▸ ${name} @ ${timestamp} ${actionLabel}`);
      } else {
        log.group(`▸ ${name} @ ${timestamp} ${actionLabel}`);
      }

      log.log("prev state", prevState);
      log.log("action    ", actionLabel);

      next(partial);

      const nextState = api.getState();
      log.log("next state", nextState);

      if (showDiff) {
        log.log("diff      ", shallowDiff(prevState as Record<string, unknown>, nextState as Record<string, unknown>));
      }

      log.groupEnd();
    },
  };
}
