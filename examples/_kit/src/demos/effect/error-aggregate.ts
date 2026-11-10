import { effect, signal } from "@slux/core";
import { defineDemo } from "../../types.js";

const describe = (error: unknown) => {
  if (error instanceof AggregateError) {
    const messages = error.errors.map((item) => (item instanceof Error ? item.message : String(item)));
    return `AggregateError(${messages.length})：${messages.join(" / ")}`;
  }
  return error instanceof Error ? error.message : String(error);
};

export const effectError = defineDemo({
  id: "effect-error",
  api: "effect",
  apiLabel: "effect · 错误汇总",
  title: "一个报错不挡住另一个",
  summary: "flush 会继续执行其余待办任务：多个 effect 同时抛错时，写入最终抛出 AggregateError，状态已经提交。",
  create({ log }) {
    const value = signal(0);
    let captured = 0;
    let lastError = "—";

    const guard = (name: string) =>
      effect(() => {
        const current = value.get();
        if (current >= 2) throw new Error(`${name} 拒绝 ${current}`);
        log(`${name} 运行：${current}`, "effect");
      });

    const stopA = guard("effect A");
    const stopB = guard("effect B");

    const write = () => {
      try {
        value.set(value.get() + 1);
        log(`写入成功：${value.get()}`, "write");
      } catch (error) {
        captured += 1;
        lastError = describe(error);
        log(lastError, "error");
      }
    };

    return {
      readouts: [
        { kind: "metric", label: "value", read: () => String(value.get()) },
        {
          kind: "metric",
          label: "捕获错误次数",
          emphasis: true,
          read: () => String(captured),
        },
        { kind: "text", label: "最近一次错误", read: () => lastError },
      ],
      actions: [{ id: "write", label: "value + 1", primary: true, run: write }],
      note: "两个 effect 都在 value ≥ 2 时抛错，写入方收到的是一条汇总错误。",
      dispose: () => {
        stopA();
        stopB();
      },
    };
  },
});
