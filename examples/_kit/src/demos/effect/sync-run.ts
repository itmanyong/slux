import { effect, signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const effectSyncRun = defineDemo({
  id: "effect-sync",
  api: "effect",
  apiLabel: "effect(fn)",
  title: "写入返回之前就已经跑完",
  summary: "effect 创建时同步执行一次，之后依赖变化时在写入的 flush 阶段同步重跑；相同值写入不会重跑。",
  create({ log }) {
    const count = signal(0);
    let runs = 0;

    const stop = effect(() => {
      runs += 1;
      log(`第 ${runs} 次运行：读到 ${count.get()}`, "effect");
    });

    return {
      readouts: [
        { kind: "metric", label: "count", read: () => String(count.get()) },
        {
          kind: "metric",
          label: "effect 运行次数",
          emphasis: true,
          read: () => String(runs),
        },
        {
          kind: "text",
          label: "执行时机",
          read: () => "set() 返回时，日志里已经出现了本次运行",
        },
      ],
      actions: [
        {
          id: "increment",
          label: "count + 1",
          primary: true,
          run: () => {
            log(`set(${count.get() + 1})`, "write");
            count.set((current) => current + 1);
          },
        },
        {
          id: "decrement",
          label: "count − 1",
          run: () => {
            log(`set(${count.get() - 1})`, "write");
            count.set((current) => current - 1);
          },
        },
        {
          id: "same",
          label: "写入相同值",
          run: () => {
            count.set(count.get());
            log("没有变化，因此不会重跑", "info");
          },
        },
      ],
      dispose: stop,
    };
  },
});
