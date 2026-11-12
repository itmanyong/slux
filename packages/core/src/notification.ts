/** @file 通知器：订阅回调的统一派发，值快照在派发时读取。 */
import { runAll } from "@slux/shared";
import { queueNotification } from "./graph.js";

/**
 * 创建通知器：把读取函数包装为可订阅对象。
 * notify 只入队、派发时才读取当前值，保证一轮派发内所有订阅者看到同一快照。
 */
export function createNotifier<T>(read: () => T) {
  const callbacks = new Set<(value: T) => void>();
  const deliver = () => {
    // 派发开始时只读取一次当前值，作为本轮所有回调共享的快照。
    const value = read();
    runAll(
      Array.from(callbacks, (callback) => () => {
        // 派发期间可能被退订，只对仍存留的回调调用。
        if (callbacks.has(callback)) callback(value);
      }),
    );
  };

  return {
    subscribe(callback: (value: T) => void): () => void {
      callbacks.add(callback);
      return () => {
        callbacks.delete(callback);
      };
    },
    notify(): void {
      if (callbacks.size > 0) queueNotification(deliver);
    },
  };
}
