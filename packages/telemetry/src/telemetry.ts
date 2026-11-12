/**
 * @file telemetry 中间件：在 Store 生命周期节点采集状态变更、初始化、订阅与错误并回调上报。
 * 上报落地由注入的回调承担；回调与 filter 的异常均转交 onError，next 的业务异常原样传播。
 */

import type { ErrorContext, TelemetryMiddleware, TelemetryOptions } from "./types.js";

/**
 * 创建时间读数函数：优先使用宿主 performance.now，缺失时回退到 Date.now。
 */
function createTimer(): () => number {
  const timer = (globalThis as { performance?: { now?: () => number } }).performance;
  if (timer !== undefined && typeof timer.now === "function") return timer.now.bind(timer);
  return () => Date.now();
}

/**
 * 创建一个 telemetry 中间件，在 Store 生命周期节点采集状态变更、初始化、订阅与错误并回调上报。
 * 所有上报回调与 filter 的异常都被捕获并转交 onError，不向 Store 主流程抛出；next 的业务异常除外。
 * @template T Store 状态类型。
 * @param options 遥测配置，各回调与 filter 均可选。
 * @returns TelemetryMiddleware<T>，钩子由 Store 在对应时机调用，另含 setEnabled/isEnabled 开关。
 * @see createTimer 计时源
 * @see reportError 错误统一上报
 */
export function telemetry<T>(options: TelemetryOptions<T> = {}): TelemetryMiddleware<T> {
  // 整个中间件生命周期内复用同一时钟源，保证各次耗时可比。
  const now = createTimer();
  const { onStateChange, onInit, onSubscribe, onError, filter } = options;
  let enabled = true;
  // 累计状态变更次数，含被过滤与暂停期间的更新；onDestroy 归零。
  let changeCount = 0;
  let totalSubscriptions = 0;

  /**
   * 统一上报遥测回调抛出的错误；onError 自身的异常也被吞掉，不影响业务状态。
   * @param context 错误上下文，含原始 error、来源标签与可选状态快照。
   */
  function reportError(context: ErrorContext<T>): void {
    try {
      onError?.(context);
    } catch {
      // 遥测自身的错误处理失败不能影响业务状态。
    }
  }

  return {
    /** 中间件名称，用于标识与去重。 */
    name: "telemetry",
    /**
     * 生命周期 init：在启用且配置了 onInit 时上报初始化事件。
     * @param api Store 中间件上下文，用于取当前状态。
     */
    init(api) {
      if (!enabled || onInit === undefined) return;
      try {
        onInit(api.getState(), {
          name: "telemetry",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        reportError({ error, source: "onInit", state: api.getState() });
      }
    },
    /**
     * 生命周期 onSet：推进状态更新，并按开关与 filter 决定是否上报变更元数据。
     * next 的业务异常原样传播，不被遥测吞掉。
     * @param api Store 中间件上下文，用于读取前状态与后状态。
     * @param next 链中的下一个 set 函数。
     * @param partial 本次局部更新。
     */
    onSet(api, next, partial) {
      const start = now();
      const prevState = api.getState();
      next(partial);
      changeCount += 1;
      if (!enabled || onStateChange === undefined) return;
      const nextState = api.getState();
      if (filter !== undefined) {
        try {
          // filter 返回 false 表示本次变更不上报，计数仍保留。
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
          // 计时起点在 next 之前记录，durationMs 覆盖整个更新链路。
          durationMs: now() - start,
          changeCount,
        });
      } catch (error) {
        reportError({ error, source: "onStateChange", state: nextState });
      }
    },
    /**
     * 生命周期 onSubscribe：累计订阅次数，并在启用且配置回调时上报订阅事件。
     * @param listener 原始订阅监听器。
     * @returns 传入的 listener 本身，保持 Store 的订阅语义不变。
     */
    onSubscribe(_api, listener) {
      totalSubscriptions += 1;
      if (enabled && onSubscribe !== undefined) {
        try {
          onSubscribe({
            name: "telemetry",
            totalSubscriptions,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          // 订阅场景无状态快照。
          reportError({ error, source: "onSubscribe", state: undefined });
        }
      }
      return listener;
    },
    /**
     * 生命周期 onDestroy：重置累计计数。
     */
    onDestroy() {
      changeCount = 0;
      totalSubscriptions = 0;
    },
    /**
     * 运行期切换上报开关。
     * @param value true 启用上报、false 暂停上报；暂停期间计数仍会累计。
     */
    setEnabled(value) {
      enabled = value;
    },
    /**
     * 读取当前上报开关状态。
     * @returns true 表示启用，false 表示暂停。
     */
    isEnabled() {
      return enabled;
    },
  };
}
