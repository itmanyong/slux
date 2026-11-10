import { createMachine } from "@slux/state-machine";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface PulseContext {
  ticks: number;
}

type PulseEvent = { type: "START" } | { type: "PULSE" } | { type: "RESET" };

type PulseState = "idle" | "running";

/** 脉冲计数：不带 target 的转换原地执行 action，状态不动。 */
export function createPulseCounter({ log }: { log: Log }) {
  const machine = createMachine<PulseContext, PulseEvent, PulseState>({
    initial: "idle",
    context: { ticks: 0 },
    states: {
      idle: {
        on: {
          START: { target: "running" },
        },
      },
      running: {
        on: {
          PULSE: {
            // 缺省 target：原地转换，只跑 action 不换状态。
            actions: [(context) => ({ ...context, ticks: context.ticks + 1 })],
          },
          RESET: {
            target: "idle",
            actions: [(context) => ({ ...context, ticks: 0 })],
          },
        },
      },
    },
  });

  log("原地转换：PULSE 只更新 context，状态停在 running", "info");

  const send = (event: PulseEvent): void => {
    const before = machine.get();
    const after = machine.send(event);
    if (after === before) {
      log(`send ${event.type} → 被忽略（当前状态不接受）`, "error");
      return;
    }
    log(
      `send ${event.type} → ${before.value} → ${after.value}，ticks ${after.context.ticks}`,
      after.value === before.value ? "effect" : "write",
    );
  };

  return {
    readouts: [
      {
        kind: "metric" as const,
        label: "state",
        emphasis: true,
        read: () => machine.get().value,
      },
      {
        kind: "metric" as const,
        label: "ticks",
        read: () => String(machine.get().context.ticks),
      },
    ],
    actions: [
      {
        id: "start",
        label: "START",
        primary: true,
        run: () => send({ type: "START" }),
      },
      { id: "pulse", label: "PULSE", run: () => send({ type: "PULSE" }) },
      { id: "reset", label: "RESET", run: () => send({ type: "RESET" }) },
    ],
    dispose: () => machine.destroy(),
  };
}
