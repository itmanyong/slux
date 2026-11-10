import { effect, signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const effectUntracked = defineDemo({
  id: "effect-untracked",
  api: "effect",
  apiLabel: "effect · 清理函数中的读取",
  title: "清理函数里的读取不算依赖",
  summary: "回调返回的清理函数在无依赖追踪的环境里执行，所以读取 noise 不会让 effect 订阅它。",
  create({ log }) {
    const primary = signal("A");
    const noise = signal(0);
    let runs = 0;

    const stop = effect(() => {
      const value = primary.get();
      runs += 1;
      log(`运行 #${runs}：primary = ${value}`, "effect");
      return () => {
        log(`清理时读取 noise = ${noise.get()}，未计入依赖`, "info");
      };
    });

    return {
      readouts: [
        { kind: "metric", label: "primary", read: () => primary.get() },
        { kind: "metric", label: "noise", read: () => String(noise.get()) },
        {
          kind: "metric",
          label: "effect 运行次数",
          emphasis: true,
          read: () => String(runs),
        },
      ],
      actions: [
        {
          id: "flip-primary",
          label: "切换 primary",
          primary: true,
          run: () => {
            primary.set(primary.get() === "A" ? "B" : "A");
            log(`primary → ${primary.get()}：清理与运行各一次`, "write");
          },
        },
        {
          id: "bump-noise",
          label: "noise + 1",
          run: () => {
            noise.set((current) => current + 1);
            log("noise 只在清理函数里被读过，不构成依赖", "write");
          },
        },
      ],
      dispose: stop,
    };
  },
});
