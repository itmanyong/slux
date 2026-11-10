import { batch, effect, signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const batchNotTransaction = defineDemo({
  id: "batch-not-transaction",
  api: "batch",
  apiLabel: "batch · 异常语义",
  title: "批处理不是事务",
  summary: "回调抛错时，已经提交的写入照常刷新，错误再继续向外抛出。批处理只合并时机，不回滚状态。",
  create({ log }) {
    const count = signal(0);
    let runs = 0;
    let lastError = "—";

    const stop = effect(() => {
      runs += 1;
      log(`effect #${runs}：${count.get()}`, "effect");
    });

    return {
      readouts: [
        { kind: "metric", label: "count", read: () => String(count.get()) },
        {
          kind: "metric",
          label: "effect 次数",
          emphasis: true,
          read: () => String(runs),
        },
        { kind: "text", label: "最近一次错误", read: () => lastError },
      ],
      actions: [
        {
          id: "throw",
          label: "批内写入后抛错",
          primary: true,
          run: () => {
            try {
              batch(() => {
                count.set(count.get() + 1);
                count.set(count.get() + 10);
                log("写入已完成，现在抛错", "write");
                throw new Error("回调中途失败");
              });
            } catch (error) {
              lastError = error instanceof Error ? error.message : String(error);
              log(`${lastError}：写入没有回滚，刷新仍然发生`, "error");
            }
          },
        },
      ],
      note: "需要原子性请在应用层自行校验；batch 只负责合并通知时机。",
      dispose: stop,
    };
  },
});
