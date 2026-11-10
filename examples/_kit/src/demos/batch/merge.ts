import { batch, effect, signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const batchMerge = defineDemo({
  id: "batch-merge",
  api: "batch",
  apiLabel: "batch(fn)",
  title: "多次写入，一次通知",
  summary: "批处理把通知与 effect 合并到最外层结束时统一刷新。批外三次写入产生三次通知，批内只产生一次。",
  create({ log }) {
    const count = signal(0);
    let notifications = 0;
    let runs = 0;

    const unsubscribe = count.subscribe((value) => {
      notifications += 1;
      log(`通知 #${notifications}：${value}`, "notify");
    });

    const stop = effect(() => {
      runs += 1;
      log(`effect #${runs}：${count.get()}`, "effect");
    });

    return {
      readouts: [
        { kind: "metric", label: "count", read: () => String(count.get()) },
        {
          kind: "metric",
          label: "通知次数",
          emphasis: true,
          read: () => String(notifications),
        },
        { kind: "metric", label: "effect 次数", read: () => String(runs) },
      ],
      actions: [
        {
          id: "plain",
          label: "批外写入 3 次",
          primary: true,
          run: () => {
            count.set(count.get() + 1);
            count.set(count.get() + 1);
            count.set(count.get() + 1);
            log("三次独立写入：通知与 effect 各执行 3 次", "write");
          },
        },
        {
          id: "batched",
          label: "批内写入 3 次",
          run: () => {
            batch(() => {
              count.set(count.get() + 1);
              count.set(count.get() + 1);
              count.set(count.get() + 1);
              log(`批内读取立即可见：${count.get()}`, "info");
            });
            log("批处理结束只刷新一次，通知读到的是最终值", "write");
          },
        },
      ],
      dispose: () => {
        unsubscribe();
        stop();
      },
    };
  },
});
