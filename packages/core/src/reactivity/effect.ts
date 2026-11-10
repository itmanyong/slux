import { batch } from "./batch.js";
import { collect, disconnect, queueEffect, sourcesChanged, untracked } from "../runtime/graph.js";
import type { Consumer } from "../runtime/graph.js";

export function effect(fn: () => void | (() => void)): () => void {
  let cleanup: void | (() => void);
  let initialized = false;
  const consumer: Consumer = {
    dependencies: new Map(),
    dirty: true,
    disposed: false,
    notify: () => {
      queueEffect(run);
    },
  };

  function runCleanup(): void {
    const previous = cleanup;
    cleanup = undefined;
    if (previous) untracked(previous);
  }

  function dispose(): void {
    if (consumer.disposed) return;
    consumer.disposed = true;
    disconnect(consumer);
    runCleanup();
  }

  function run(): void {
    if (consumer.disposed || !consumer.dirty) return;
    consumer.dirty = false;
    if (initialized && !sourcesChanged(consumer)) {
      return;
    }
    runCleanup();
    initialized = true;
    cleanup = collect(consumer, fn);
    if (consumer.disposed) runCleanup();
  }

  try {
    batch(run);
  } catch (error) {
    dispose();
    throw error;
  }
  return dispose;
}
