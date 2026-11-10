import { computed, effect, signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const computedEquals = defineDemo({
  id: "computed-equals",
  api: "computed",
  apiLabel: "computed(fn, { equals })",
  title: "结果相等就到此为止",
  summary: "派生值用 equals 判定相等时，保留旧引用并跳过下游通知。count 变化 2 只重算，不会让 effect 重跑。",
  create({ log }) {
    const count = signal(0);
    let computes = 0;
    let runs = 0;
    let current = "—";

    const label = computed(
      () => {
        computes += 1;
        log(`第 ${computes} 次计算`, "compute");
        return { parity: count.get() % 2 === 0 ? "偶数" : "奇数" };
      },
      { equals: (previous, next) => previous.parity === next.parity },
    );

    const stop = effect(() => {
      runs += 1;
      current = label.get().parity;
      log(`effect 第 ${runs} 次运行：${current}`, "effect");
    });

    const bump = (step: number) => {
      count.set((value) => value + step);
      log(`count + ${step} → ${count.get()}`, "write");
    };

    return {
      readouts: [
        { kind: "metric", label: "count", read: () => String(count.get()) },
        {
          kind: "metric",
          label: "effect 看到的奇偶",
          emphasis: true,
          read: () => current,
        },
        {
          kind: "metric",
          label: "computed 计算次数",
          read: () => String(computes),
        },
        { kind: "metric", label: "effect 运行次数", read: () => String(runs) },
      ],
      actions: [
        {
          id: "plus-one",
          label: "count + 1",
          primary: true,
          run: () => bump(1),
        },
        { id: "plus-two", label: "count + 2", run: () => bump(2) },
        { id: "plus-ten", label: "count + 10", run: () => bump(10) },
      ],
      note: "computed 会重算，但结果相等时下游 effect 保持不动。",
      dispose: stop,
    };
  },
});
