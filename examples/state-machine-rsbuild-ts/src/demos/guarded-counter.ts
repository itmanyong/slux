import { createMachine } from "@slux/state-machine";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface StepContext {
  count: number;
}

type StepEvent = { type: "INC" } | { type: "DEC" } | { type: "RESET" };

/** 步进器：guard 拦截越界事件，can() 随时可查询。 */
export function createGuardedCounter({ log }: { log: Log }) {
  const machine = createMachine<StepContext, StepEvent, "active">({
    initial: "active",
    context: { count: 0 },
    states: {
      active: {
        on: {
          INC: {
            guard: (context) => context.count < 3,
            actions: [(context) => ({ ...context, count: context.count + 1 })],
          },
          DEC: {
            guard: (context) => context.count > 0,
            actions: [(context) => ({ ...context, count: context.count - 1 })],
          },
          RESET: {
            actions: [(context) => (context.count === 0 ? undefined : { count: 0 })],
          },
        },
      },
    },
  });

  log("guard：count 限定在 0..3，越界事件被拒绝", "info");

  const send = (event: StepEvent): void => {
    const before = machine.get();
    const after = machine.send(event);
    if (after === before) {
      log(`send ${event.type} → 无变化（count 停在 ${after.context.count}）`, "error");
      return;
    }
    log(`send ${event.type} → count ${before.context.count} → ${after.context.count}`, "write");
  };

  return {
    readouts: [
      {
        kind: "metric" as const,
        label: "count",
        emphasis: true,
        read: () => String(machine.get().context.count),
      },
      {
        kind: "text" as const,
        label: "can(INC)",
        read: () => (machine.can({ type: "INC" }) ? "true" : "false"),
      },
      {
        kind: "text" as const,
        label: "can(DEC)",
        read: () => (machine.can({ type: "DEC" }) ? "true" : "false"),
      },
    ],
    actions: [
      {
        id: "inc",
        label: "INC",
        primary: true,
        run: () => send({ type: "INC" }),
      },
      { id: "dec", label: "DEC", run: () => send({ type: "DEC" }) },
      { id: "reset", label: "RESET", run: () => send({ type: "RESET" }) },
    ],
    dispose: () => machine.destroy(),
  };
}
