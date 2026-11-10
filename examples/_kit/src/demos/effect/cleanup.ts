import { effect, signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const effectCleanup = defineDemo({
  id: "effect-cleanup",
  api: "effect",
  apiLabel: "effect(fn) => cleanup",
  title: "清理函数贴着上一轮运行",
  summary: "回调返回的函数会在下一次重跑前执行，并在释放时再执行一次；释放后写入不再触发重跑。",
  create({ log }) {
    const count = signal(0);
    let runs = 0;
    let cleanups = 0;
    let stop: (() => void) | undefined;

    stop = effect(() => {
      const value = count.get();
      runs += 1;
      log(`运行 #${runs}：当前值 ${value}`, "effect");
      return () => {
        cleanups += 1;
        log(`清理 #${cleanups}：释放 ${value}`, "info");
      };
    });

    const dispose = () => {
      if (!stop) {
        log("已经释放，dispose 可以重复调用", "info");
        return;
      }
      stop();
      stop = undefined;
      log("已释放：最后一次清理已执行", "info");
    };

    return {
      readouts: [
        { kind: "metric", label: "count", read: () => String(count.get()) },
        {
          kind: "metric",
          label: "运行次数",
          emphasis: true,
          read: () => String(runs),
        },
        { kind: "metric", label: "清理次数", read: () => String(cleanups) },
        {
          kind: "metric",
          label: "状态",
          read: () => (stop ? "运行中" : "已释放"),
        },
      ],
      actions: [
        {
          id: "increment",
          label: "count + 1",
          primary: true,
          run: () => {
            count.set((current) => current + 1);
            log("先清理上一轮，再运行这一轮", "write");
          },
        },
        { id: "dispose", label: "释放 effect", run: dispose },
        {
          id: "write-after",
          label: "释放后写入",
          run: () => {
            count.set((current) => current + 1);
            log("effect 已释放，本次写入没有任何运行或清理", "write");
          },
        },
      ],
      dispose: () => stop?.(),
    };
  },
});
