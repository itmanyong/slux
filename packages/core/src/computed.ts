/** @file 计算信号：惰性求值与缓存，依赖变化且值确实变化时才向下游传播。 */
import { batch } from "./batch.js";
import { collect, createSource, invalidate, sourcesChanged, track, untracked } from "./graph.js";
import type { Consumer } from "./graph.js";
import { createNotifier } from "./notification.js";
import type { ReadonlySignal, SignalOptions } from "./types.js";

/**
 * 创建只读计算信号：惰性求值 fn 并缓存结果，依赖变化且 equals 判定变化时才更新并向下传播。
 * 计算过程中再次读取自身会抛出循环依赖错误。
 */
export function computed<T>(fn: () => T, options?: SignalOptions<T>): ReadonlySignal<T> {
  const source = createSource();
  const equals = options?.equals ?? Object.is;
  let value: T;
  let initialized = false;
  let evaluating = false; // 重入守卫：计算进行中再次进入视为循环依赖。
  let failed = false; // 上次抛错后置位，使下次读取仍会重试。
  const notifier = createNotifier(() => value);
  const consumer: Consumer = {
    dependencies: new Map(),
    dirty: true, // 初始为 true，保证首次读取触发计算。
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
      // 清除脏标记但保留 failed：后续写入仍可向下游传播失效。
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
        // refresh 前后各 track 一次：失败时仍保留依赖；成功后再记录刷新后的版本，避免下游多算一次。
        track(source);
        source.refresh!();
        track(source);
        return value;
      });
    },
    subscribe: notifier.subscribe,
  };
}
