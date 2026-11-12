/** @file 响应式图核心：Source/Consumer 依赖追踪、失效传播与批处理派发。 */
import { runAll } from "@slux/shared";

/**
 * 依赖源：可被 Consumer 追踪的最小单元，写入方递增 version 并 invalidate 触发下游。
 */
export type Source = {
  /** 版本号，值变化后由写入方递增，供 sourcesChanged 比对。 */
  version: number;
  /** 反向订阅本源的 Consumer 集合。 */
  consumers: Set<Consumer>;
  /** 惰性源的刷新回调（如 computed 注入的重算逻辑）。 */
  refresh?: () => void;
};

/**
 * 依赖消费者：用 dependencies 记录「源 -> 订阅时的 version」，据此按需重算。
 */
export type Consumer = {
  /** 依赖映射：键为 Source，值为订阅时记下的 version。 */
  dependencies: Map<Source, number>;
  /** 脏标记：为 true 表示依赖可能已变、需重新求值。 */
  dirty: boolean;
  /** 已销毁标志：置位后 track / invalidate 等入口跳过该消费者。 */
  disposed: boolean;
  /** 依赖变化时的回调，决定入队重跑还是向下游失效。 */
  notify(): void;
};

// 当前正在收集依赖的消费者，仅在当前同步调用栈内有效。
let activeConsumer: Consumer | undefined;
// 批处理嵌套深度；大于 0 时暂缓派发，归零后才允许 flush。
let batchDepth = 0;
// flush 防重入标志。
let flushing = false;
// 待派发的通知 / effect 任务队列；Set 去重，同一任务只入队一次。
const notifications = new Set<() => void>();
const effects = new Set<() => void>();

/** 创建一个初始依赖源。 */
export function createSource(): Source {
  return { version: 0, consumers: new Set() };
}

/** 将 source 记为当前消费者的依赖并建立反向订阅；无有效活动消费者时不生效。 */
export function track(source: Source): void {
  if (activeConsumer === undefined || activeConsumer.disposed) return;
  activeConsumer.dependencies.set(source, source.version);
  source.consumers.add(activeConsumer);
}

/**
 * 在 consumer 的依赖收集上下文中执行 fn，并重建其依赖表。
 * 结束时移除不再依赖的旧源反向订阅，避免陈旧订阅。
 */
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

/**
 * 临时清空活动消费者执行 fn，使其中的读取不进入任何依赖表。
 * 支持嵌套，结束时复原。
 */
export function untracked<T>(fn: () => T): T {
  const previous = activeConsumer;
  activeConsumer = undefined;
  try {
    return fn();
  } finally {
    activeConsumer = previous;
  }
}

/** 断开 consumer 的全部依赖：从各源的反向订阅中移除并清空依赖表。 */
export function disconnect(consumer: Consumer): void {
  for (const source of consumer.dependencies.keys()) source.consumers.delete(consumer);
  consumer.dependencies.clear();
}

/**
 * 使 source 的订阅者失效：把尚未标脏且未销毁的消费者标脏并通知。
 * 已脏的消费者跳过，同一轮内重复 invalidate 不会重复通知。
 */
export function invalidate(source: Source): void {
  for (const consumer of source.consumers) {
    if (consumer.disposed || consumer.dirty) continue;
    consumer.dirty = true;
    consumer.notify();
  }
}

/**
 * 判断 consumer 的依赖自订阅以来是否有变化：先触发惰性源 refresh，再逐项比对 version。
 */
export function sourcesChanged(consumer: Consumer): boolean {
  for (const [source, version] of consumer.dependencies) {
    try {
      source.refresh?.();
    } catch {
      return true; // 保守判定为「已变化」，交由用户 fn 内的 try/catch 处理派生错误。
    }
    if (source.version !== version) return true;
  }
  return false;
}

/** 进入一层批处理，使期间的写入暂缓派发；须与 endBatch 配对。 */
export function startBatch(): void {
  batchDepth++;
}

/** 退出一层批处理；在最外层（深度归零）时触发派发。 */
export function endBatch(): void {
  batchDepth--;
  flush();
}

/** 将通知任务排入待派发队列，由 flush 统一执行。 */
export function queueNotification(task: () => void): void {
  notifications.add(task);
}

/** 将 effect 任务排入待派发队列；派发时通知优先于 effect。 */
export function queueEffect(task: () => void): void {
  effects.add(task);
}

// 每轮优先取通知、再取 effect；派发中新入队的任务也由同一轮刷新消费。
function* pendingTasks(): Generator<() => void> {
  while (notifications.size > 0 || effects.size > 0) {
    const queue = notifications.size > 0 ? notifications : effects;
    const task = queue.values().next().value!;
    queue.delete(task); // 先移除再执行，避免重复取出。
    yield task;
  }
}

/**
 * 消费全部待派发任务（通知优先、effect 其次），派发期间不收集依赖。
 * 批处理未结束、正在派发或处于依赖收集上下文时都不派发。
 */
function flush(): void {
  if (batchDepth > 0 || flushing || activeConsumer !== undefined) return;
  flushing = true;
  try {
    untracked(() => runAll(pendingTasks()));
  } finally {
    flushing = false;
  }
}
