/**
 * @file logger 中间件：在每次状态更新时以分组形式输出前状态、动作、后状态与可选差异。
 * 日志器缺省回退到 console，可由 options 注入替换。
 */

import type { LoggerMiddleware, LoggerOptions, LoggerInterface, MiddlewareAPI, SetFn } from "./types.js";
import { deriveActionName } from "./utils.js";

/**
 * 把 Date 格式化为 `HH:MM:SS.mmm` 形式的时间串，用于日志前缀。
 * @param date 待格式化的时间对象。
 */
function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  return `${h}:${m}:${s}.${ms}`;
}

/**
 * 计算两个状态对象的浅层差异，返回发生变化的键及其前后值。
 * 仅按严格不等（!==）比较，不递归比较嵌套对象。
 * @param prev 变更前状态。
 * @param next 变更后状态。
 * @returns 差异对象：键为变化字段名，值为 { prev, next }；无差异时为空对象。
 */
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

/**
 * 创建一个 logger 中间件，在每次状态更新时按分组输出前状态、动作、后状态及可选差异。
 * @template T Store 状态类型。
 * @param options 可选配置，省略项采用默认值。
 * @returns LoggerMiddleware<T>，仅含 name 与 onSet 钩子，由 Store 在每次 set 时调用。
 */
export function logger<T>(options?: LoggerOptions): LoggerMiddleware<T> {
  const name = options?.name ?? "Slux";
  const collapsed = options?.collapsed ?? true;
  const showDiff = options?.diff ?? false;
  const enabled = options?.enabled ?? true;
  const log: LoggerInterface = options?.logger ?? console;
  const actionNameFn = options?.actionName;

  return {
    /** 中间件名称，用于标识与去重。 */
    name: "logger",

    /**
     * 生命周期 onSet：透传状态更新，并在启用时输出一组结构化日志。
     * @param api Store 中间件上下文，用于读取前状态与后状态。
     * @param next 链中的下一个 set 函数。
     * @param partial 本次局部更新。
     */
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

      // 标签串尾部补空格，使各行日志值在同一列对齐。
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
