import { computed } from "@slux/core";
import type { ReadonlySignal } from "@slux/core";
import { defineDemo } from "../../types.js";

export const computedCycle = defineDemo({
  id: "computed-cycle",
  api: "computed",
  apiLabel: "computed · 循环依赖",
  title: "互相依赖会立刻报错",
  summary: "两个 computed 互相读取时，求值过程中会检测到循环并抛出错误；错误可以被外部 try/catch 捕获。",
  create({ log }) {
    const a: ReadonlySignal<number> = computed(() => b.get() + 1);
    const b: ReadonlySignal<number> = computed(() => a.get() + 1);
    let errors = 0;
    let result = "尚未读取";

    const read = (name: string, source: ReadonlySignal<number>) => {
      try {
        result = `${name} = ${source.get()}`;
        log(`读取成功：${result}`, "compute");
      } catch (error) {
        errors += 1;
        result = error instanceof Error ? error.message : String(error);
        log(`读取失败：${result}`, "error");
      }
    };

    return {
      readouts: [
        { kind: "text", label: "读取结果", read: () => result },
        { kind: "metric", label: "捕获错误次数", read: () => String(errors) },
      ],
      actions: [
        {
          id: "read-a",
          label: "读取 a",
          primary: true,
          run: () => read("a", a),
        },
        { id: "read-b", label: "读取 b", run: () => read("b", b) },
      ],
      note: "a 依赖 b，b 又依赖 a；求值器在递归回到自身时抛出错误。",
    };
  },
});
