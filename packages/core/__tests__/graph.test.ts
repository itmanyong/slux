import { describe, expect, it } from "rstack/test";
import {
  collect,
  createSource,
  disconnect,
  endBatch,
  invalidate,
  queueEffect,
  queueNotification,
  startBatch,
  track,
  type Consumer,
} from "../src/graph.js";

describe("runtime/graph", () => {
  it("重新收集时去重并移除旧依赖，释放后不再通知", () => {
    const previous = createSource();
    const current = createSource();
    let notifications = 0;
    const consumer: Consumer = {
      dependencies: new Map(),
      dirty: false,
      disposed: false,
      notify() {
        notifications++;
      },
    };

    collect(consumer, () => {
      track(previous);
      track(previous);
    });
    expect(consumer.dependencies.size).toBe(1);
    expect(previous.consumers.size).toBe(1);

    collect(consumer, () => track(current));
    invalidate(previous);
    expect(notifications).toBe(0);
    expect(previous.consumers.size).toBe(0);
    invalidate(current);
    invalidate(current);
    expect(notifications).toBe(1);

    disconnect(consumer);
    consumer.dirty = false;
    invalidate(current);
    expect(notifications).toBe(1);
    expect(consumer.dependencies.size).toBe(0);
    expect(current.consumers.size).toBe(0);
  });

  it("嵌套批处理去重任务，优先通知并在同次刷新执行新增任务", () => {
    const order: string[] = [];
    const notify = () => order.push("notify");
    const effect = () => {
      order.push("effect");
      queueEffect(() => order.push("next effect"));
      queueNotification(() => order.push("next notify"));
    };

    startBatch();
    try {
      startBatch();
      try {
        queueEffect(effect);
        queueEffect(effect);
        queueNotification(notify);
        queueNotification(notify);
      } finally {
        endBatch();
      }
      expect(order).toEqual([]);
    } finally {
      endBatch();
    }
    expect(order).toEqual(["notify", "effect", "next notify", "next effect"]);
  });
});
