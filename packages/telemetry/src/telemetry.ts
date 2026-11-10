import type { ErrorContext, TelemetryMiddleware, TelemetryOptions } from "./types.js";

function createTimer(): () => number {
  const timer = (globalThis as { performance?: { now?: () => number } }).performance;
  if (timer !== undefined && typeof timer.now === "function") return timer.now.bind(timer);
  return () => Date.now();
}

export function telemetry<T>(options: TelemetryOptions<T> = {}): TelemetryMiddleware<T> {
  const now = createTimer();
  const { onStateChange, onInit, onSubscribe, onError, filter } = options;
  let enabled = true;
  let changeCount = 0;
  let totalSubscriptions = 0;

  function reportError(context: ErrorContext<T>): void {
    try {
      onError?.(context);
    } catch {
      // 遥测自身的错误处理失败不能影响业务状态。
    }
  }

  return {
    name: "telemetry",
    init(api) {
      if (!enabled || onInit === undefined) return;
      try {
        onInit(api.getState(), { name: "telemetry", timestamp: new Date().toISOString() });
      } catch (error) {
        reportError({ error, source: "onInit", state: api.getState() });
      }
    },
    onSet(api, next, partial) {
      const start = now();
      const prevState = api.getState();
      // next 的业务异常必须继续向调用者传播，不能作为遥测错误吞掉。
      next(partial);
      changeCount += 1;
      if (!enabled || onStateChange === undefined) return;
      const nextState = api.getState();
      if (filter !== undefined) {
        try {
          if (!filter(prevState, nextState, partial)) return;
        } catch (error) {
          reportError({ error, source: "filter", state: nextState });
          return;
        }
      }
      try {
        onStateChange({
          name: "telemetry",
          prevState,
          nextState,
          partial,
          timestamp: new Date().toISOString(),
          durationMs: now() - start,
          changeCount,
        });
      } catch (error) {
        reportError({ error, source: "onStateChange", state: nextState });
      }
    },
    onSubscribe(_api, listener) {
      totalSubscriptions += 1;
      if (enabled && onSubscribe !== undefined) {
        try {
          onSubscribe({ name: "telemetry", totalSubscriptions, timestamp: new Date().toISOString() });
        } catch (error) {
          reportError({ error, source: "onSubscribe", state: undefined });
        }
      }
      return listener;
    },
    onDestroy() {
      changeCount = 0;
      totalSubscriptions = 0;
    },
    setEnabled(value) {
      enabled = value;
    },
    isEnabled() {
      return enabled;
    },
  };
}
