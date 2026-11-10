import { runAll } from "@slux/shared";
import { queueNotification } from "./graph.js";

export function createNotifier<T>(read: () => T) {
  const callbacks = new Set<(value: T) => void>();
  const deliver = () => {
    const value = read();
    runAll(
      Array.from(callbacks, (callback) => () => {
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
