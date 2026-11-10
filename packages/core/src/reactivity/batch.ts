import { endBatch, startBatch } from "../runtime/graph.js";

/** 写入立即可读，通知和 effect 在最外层同步批处理结束时执行。 */
export function batch<T>(fn: () => T): T {
  startBatch();
  try {
    return fn();
  } finally {
    endBatch();
  }
}
