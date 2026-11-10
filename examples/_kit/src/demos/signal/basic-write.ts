import { signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const signalBasicWrite = defineDemo({
  id: "signal-basic-write",
  api: "signal",
  apiLabel: "signal.get / set / subscribe",
  title: "一个值，所有变化的起点",
  summary: "整体替换或基于当前值更新。订阅不立即回调；写入相同值时订阅与通知都不会发生。",
  create({ log }) {
    const count = signal(0);
    let notified = 0;

    const unsubscribe = count.subscribe((value) => {
      notified += 1;
      log(`订阅回调收到 ${value}`, "notify");
    });

    const write = (next: number) => {
      log(`set(${next})，当前值 ${count.get()}`, "write");
      count.set(next);
    };

    return {
      readouts: [
        {
          kind: "metric",
          label: "count",
          emphasis: true,
          read: () => String(count.get()),
        },
        { kind: "metric", label: "订阅回调次数", read: () => String(notified) },
      ],
      actions: [
        {
          id: "increment",
          label: "count + 1",
          primary: true,
          run: () => {
            log("set(current => current + 1)", "write");
            count.set((current) => current + 1);
          },
        },
        {
          id: "decrement",
          label: "count − 1",
          run: () => {
            log("set(current => current - 1)", "write");
            count.set((current) => current - 1);
          },
        },
        {
          id: "same",
          label: "写入相同值",
          run: () => {
            log(`set(${count.get()})：与当前值相等，不通知`, "info");
            count.set(count.get());
          },
        },
        {
          id: "custom",
          label: "写入",
          input: { kind: "number", placeholder: "目标值", value: "10" },
          run: (input) => {
            const next = Number(input);
            if (Number.isNaN(next)) {
              log(`“${input}” 不是合法数字`, "error");
              return;
            }
            write(next);
          },
        },
      ],
      dispose: unsubscribe,
    };
  },
});
