/** @file 批处理：合并写入的派发时机，通知延迟到最外层批次结束。 */
import { endBatch, startBatch } from "./graph.js";

/**
 * 批处理一段同步函数，通知与 effect 重跑延迟到最外层批次结束时统一执行。
 * 仅延迟通知而不延迟可见性——写入立即可读，避免 effect 观察到中间态。
 */
export function batch<T>(fn: () => T): T {
  startBatch();
  try {
    return fn();
  } finally {
    endBatch();
  }
}
