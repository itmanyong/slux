import { computed, signal } from "@slux/core";
import { defineDemo } from "../../types.js";

type Branch = "left" | "right";

export const computedDynamicDeps = defineDemo({
  id: "computed-dynamic",
  api: "computed",
  apiLabel: "computed · 动态依赖",
  title: "只跟踪这次真正读到的分支",
  summary: "computed 每次求值都重建依赖。切到 left 后，right 的变化不再让它失效；切回时旧依赖被重新收集。",
  create({ log }) {
    const branch = signal<Branch>("left");
    const left = signal(1);
    const right = signal(100);
    let computes = 0;
    let value = "尚未读取";
    let deps: string[] = ["—"];

    const picked = computed(() => {
      computes += 1;
      const current = branch.get();
      const result = current === "left" ? left.get() : right.get();
      deps = ["branch", current];
      log(`第 ${computes} 次计算：读取 ${current}`, "compute");
      return result;
    });

    const read = () => {
      value = String(picked.get());
      log(`读取结果 ${value}，当前依赖 ${deps.join(" + ")}`, "compute");
    };

    return {
      readouts: [
        { kind: "metric", label: "branch", read: () => branch.get() },
        { kind: "metric", label: "计算次数", read: () => String(computes) },
        {
          kind: "metric",
          label: "最近一次读取结果",
          emphasis: true,
          read: () => value,
        },
        { kind: "list", label: "当前依赖", read: () => deps },
      ],
      actions: [
        { id: "read", label: "读取 computed", primary: true, run: read },
        {
          id: "switch",
          label: "切换分支",
          run: () => {
            branch.set(branch.get() === "left" ? "right" : "left");
            log(`分支切到 ${branch.get()}，需要重新读取才会重算`, "write");
          },
        },
        {
          id: "bump-left",
          label: "left + 1",
          run: () => {
            left.set((current) => current + 1);
            log(`left = ${left.get()}；只有在依赖 left 时才会引起重算`, "write");
          },
        },
        {
          id: "bump-right",
          label: "right + 10",
          run: () => {
            right.set((current) => current + 10);
            log(`right = ${right.get()}；只有在依赖 right 时才会引起重算`, "write");
          },
        },
      ],
    };
  },
});
