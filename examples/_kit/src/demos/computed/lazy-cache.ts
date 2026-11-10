import { computed, signal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const computedLazy = defineDemo({
  id: "computed-lazy",
  api: "computed",
  apiLabel: "computed · 惰性 / 缓存",
  title: "不读就不算，读过就缓存",
  summary: "computed 只在被读取且依赖已失效时重新计算。连续读取同一份结果命中缓存；写入依赖不会主动触发计算。",
  create({ log }) {
    const count = signal(1);
    let computes = 0;
    let lastRead = "尚未读取";

    const doubled = computed(() => {
      computes += 1;
      log(`第 ${computes} 次计算`, "compute");
      return count.get() * 2;
    });

    const read = (times = 1) => {
      const before = computes;
      for (let index = 0; index < times; index += 1) lastRead = String(doubled.get());
      log(`读取 ${times} 次，实际计算 ${computes - before} 次`, "compute");
    };

    return {
      readouts: [
        { kind: "metric", label: "count", read: () => String(count.get()) },
        {
          kind: "metric",
          label: "最近一次读取结果",
          emphasis: true,
          read: () => lastRead,
        },
        { kind: "metric", label: "实际计算次数", read: () => String(computes) },
      ],
      actions: [
        { id: "read", label: "读取 doubled", primary: true, run: () => read() },
        { id: "read-thrice", label: "连续读取 3 次", run: () => read(3) },
        {
          id: "write",
          label: "count + 1",
          run: () => {
            count.set((current) => current + 1);
            log("写入完成，但没有读取，因此还没有重算", "write");
          },
        },
      ],
      note: "写入后不读取，计算次数不会变化——这正是惰性求值。",
    };
  },
});
