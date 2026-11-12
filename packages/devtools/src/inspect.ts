/**
 * @file inspect 事件订阅中枢：维护检查器集合并同步派发检查事件。
 * 派发顺序即注册顺序；单个检查器异常不影响其余检查器与 Store 主流程。
 */

import type { InspectCallback, InspectEvent } from "./types.js";

/**
 * 模块级检查器回调集合，跨调用共享；Set 保证同一回调重复注册只保留一份。
 */
const inspectors = new Set<InspectCallback>();

/**
 * 注册一个检查器回调，使其在每次派发检查事件时被同步调用。
 * @param callback 检查事件回调；同一引用重复注册会被去重。
 * @returns 注销函数，仅移除本次注册项，可安全多次调用。
 * @see emitInspectEvent 事件派发入口
 * @see clearInspectors 一次性清空全部注册
 */
export function inspect(callback: InspectCallback): () => void {
  inspectors.add(callback);
  return () => {
    inspectors.delete(callback);
  };
}

/**
 * 将一个检查事件同步派发给所有已注册的检查器。
 * 逐个 try/catch 隔离异常，单个检查器抛错不中断状态更新链路及其余检查器的通知。
 * @param event 待派发的检查事件，原样透传给每个回调。
 * @see inspect 注册检查器
 */
export function emitInspectEvent(event: InspectEvent): void {
  if (inspectors.size === 0) return;
  for (const cb of inspectors) {
    // 检查器异常不能阻断 Store 更新或后续检查器。
    try {
      cb(event);
    } catch {
      // 检查器异常不能阻断 Store 更新或后续检查器。
    }
  }
}

/**
 * 清空所有已注册的检查器，使后续派发不再触发任何回调。
 * 用于整体拆卸（如测试隔离）；与单个注销闭包互不影响。
 * @see inspect 返回的注销函数用于按订阅方单独撤销
 */
export function clearInspectors(): void {
  inspectors.clear();
}
