import { runAll } from "@slux/shared";

export type Source = {
  version: number;
  consumers: Set<Consumer>;
  refresh?: () => void;
};

export type Consumer = {
  dependencies: Map<Source, number>;
  dirty: boolean;
  disposed: boolean;
  notify(): void;
};

let activeConsumer: Consumer | undefined;
let batchDepth = 0;
let flushing = false;
const notifications = new Set<() => void>();
const effects = new Set<() => void>();

export function createSource(): Source {
  return { version: 0, consumers: new Set() };
}

export function track(source: Source): void {
  if (activeConsumer === undefined || activeConsumer.disposed) return;
  activeConsumer.dependencies.set(source, source.version);
  source.consumers.add(activeConsumer);
}

export function collect<T>(consumer: Consumer, fn: () => T): T {
  const previous = activeConsumer;
  const oldDependencies = consumer.dependencies;
  consumer.dependencies = new Map();
  activeConsumer = consumer;
  try {
    return fn();
  } finally {
    activeConsumer = previous;
    for (const source of oldDependencies.keys()) {
      if (!consumer.dependencies.has(source)) source.consumers.delete(consumer);
    }
  }
}

export function untracked<T>(fn: () => T): T {
  const previous = activeConsumer;
  activeConsumer = undefined;
  try {
    return fn();
  } finally {
    activeConsumer = previous;
  }
}

export function disconnect(consumer: Consumer): void {
  for (const source of consumer.dependencies.keys()) source.consumers.delete(consumer);
  consumer.dependencies.clear();
}

export function invalidate(source: Source): void {
  for (const consumer of source.consumers) {
    if (consumer.disposed || consumer.dirty) continue;
    consumer.dirty = true;
    consumer.notify();
  }
}

export function sourcesChanged(consumer: Consumer): boolean {
  for (const [source, version] of consumer.dependencies) {
    try {
      source.refresh?.();
    } catch {
      // 在用户函数内重读，使用户的 try/catch 能处理派生错误。
      return true;
    }
    if (source.version !== version) return true;
  }
  return false;
}

export function startBatch(): void {
  batchDepth++;
}

export function endBatch(): void {
  batchDepth--;
  flush();
}

export function queueNotification(task: () => void): void {
  notifications.add(task);
}

export function queueEffect(task: () => void): void {
  effects.add(task);
}

// 每次优先取通知，再取 effect；回调新增的任务也由同一次刷新消费。
function* pendingTasks(): Generator<() => void> {
  while (notifications.size > 0 || effects.size > 0) {
    const queue = notifications.size > 0 ? notifications : effects;
    const task = queue.values().next().value!;
    queue.delete(task);
    yield task;
  }
}

function flush(): void {
  if (batchDepth > 0 || flushing || activeConsumer !== undefined) return;
  flushing = true;
  try {
    untracked(() => runAll(pendingTasks()));
  } finally {
    flushing = false;
  }
}
