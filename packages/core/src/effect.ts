/** @file 副作用：依赖变化后自动重跑的响应式 effect。 */
import { batch } from "./batch.js";
import { collect, disconnect, queueEffect, sourcesChanged, untracked } from "./graph.js";
import type { Consumer } from "./graph.js";

/**
 * 创建响应式副作用：立即执行一次 fn，其后追踪到的依赖变化时自动重跑。
 * fn 可返回清理函数，在下次重跑或 dispose 时以 untracked 方式调用。
 */
export function effect(fn: () => void | (() => void)): () => void {
  let cleanup: void | (() => void);
  let initialized = false;
  const consumer: Consumer = {
    dependencies: new Map(),
    dirty: true, // 初始为 true，保证创建后的首次运行不被短路。
    disposed: false,
    notify: () => {
      queueEffect(run);
    },
  };

  function runCleanup(): void {
    // 先置空再执行，防止清理函数重入时重复清理；untracked 避免清理中的读取污染依赖收集。
    const previous = cleanup;
    cleanup = undefined;
    if (previous) untracked(previous);
  }

  function dispose(): void {
    if (consumer.disposed) return; // 幂等。
    consumer.disposed = true; // 先置位，使断开/清理期间不再被调度。
    disconnect(consumer);
    runCleanup();
  }

  function run(): void {
    if (consumer.disposed || !consumer.dirty) return;
    consumer.dirty = false;
    if (initialized && !sourcesChanged(consumer)) {
      return;
    }
    // 先跑清理再收集新依赖，避免旧清理函数存活到新依赖期。
    runCleanup();
    initialized = true;
    cleanup = collect(consumer, fn);
    // 兜底：fn 内部同步 dispose 时不遗留清理函数。
    if (consumer.disposed) runCleanup();
  }

  try {
    batch(run);
  } catch (error) {
    // 初始化失败先自毁，避免留下半初始化的 effect。
    dispose();
    throw error;
  }
  return dispose;
}
