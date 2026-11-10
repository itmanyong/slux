import { batch } from "./batch.js";
import { collect, createSource, invalidate, sourcesChanged, track, untracked } from "../runtime/graph.js";
import type { Consumer } from "../runtime/graph.js";
import { createNotifier } from "../runtime/notification.js";
import type { ReadonlySignal, SignalOptions } from "../types/index.js";

export function computed<T>(fn: () => T, options?: SignalOptions<T>): ReadonlySignal<T> {
  const source = createSource();
  const equals = options?.equals ?? Object.is;
  let value: T;
  let initialized = false;
  let evaluating = false;
  let failed = false;
  const notifier = createNotifier(() => value);
  const consumer: Consumer = {
    dependencies: new Map(),
    dirty: true,
    disposed: false,
    notify: () => {
      invalidate(source);
    },
  };

  source.refresh = () => {
    if (evaluating) throw new Error("computed 存在循环依赖");
    if (!consumer.dirty && !failed) return;
    evaluating = true;
    try {
      if (initialized && !failed && !sourcesChanged(consumer)) {
        consumer.dirty = false;
        return;
      }
      const next = collect(consumer, fn);
      const changed = !initialized || !untracked(() => equals(value, next));
      consumer.dirty = false;
      failed = false;
      if (changed) {
        value = next;
        initialized = true;
        source.version++;
        invalidate(source);
        notifier.notify();
      }
    } catch (error) {
      // 失败保留重试标志，但允许后续写入再次向下游传播失效。
      consumer.dirty = false;
      failed = true;
      throw error;
    } finally {
      evaluating = false;
    }
  };

  return {
    get(): T {
      if (evaluating) throw new Error("computed 存在循环依赖");
      return batch(() => {
        // 失败也保留依赖；成功后再记录刷新后的版本，避免下游多算一次。
        track(source);
        source.refresh!();
        track(source);
        return value;
      });
    },
    subscribe: notifier.subscribe,
  };
}
