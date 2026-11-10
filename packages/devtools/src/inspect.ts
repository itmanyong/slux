import type { InspectCallback, InspectEvent } from "./types.js";

const inspectors = new Set<InspectCallback>();

export function inspect(callback: InspectCallback): () => void {
  inspectors.add(callback);
  return () => {
    inspectors.delete(callback);
  };
}

export function emitInspectEvent(event: InspectEvent): void {
  if (inspectors.size === 0) return;
  for (const cb of inspectors) {
    try {
      cb(event);
    } catch {
      // 检查器异常不能阻断 Store 更新或后续检查器。
    }
  }
}

export function clearInspectors(): void {
  inspectors.clear();
}
