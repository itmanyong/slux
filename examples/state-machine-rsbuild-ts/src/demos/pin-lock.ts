import { createMachine } from "@slux/state-machine";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface LockContext {
  wrong: number;
}

type LockEvent = { type: "SUBMIT"; code: string } | { type: "RESET" };

type LockState = "idle" | "granted" | "locked";

/** 密码锁：同一事件挂多条带 guard 的候选转换，按序取第一条通过的。 */
export function createPinLock({ log }: { log: Log }) {
  const machine = createMachine<LockContext, LockEvent, LockState>({
    initial: "idle",
    context: { wrong: 0 },
    states: {
      idle: {
        on: {
          SUBMIT: [
            {
              guard: (_context, event) => event.code === "1234",
              target: "granted",
            },
            {
              guard: (context) => context.wrong >= 2,
              target: "locked",
              actions: [(context) => ({ ...context, wrong: context.wrong + 1 })],
            },
            {
              target: "idle",
              actions: [(context) => ({ ...context, wrong: context.wrong + 1 })],
            },
          ],
        },
      },
      granted: {
        on: {
          RESET: {
            target: "idle",
            actions: [() => ({ wrong: 0 })],
          },
        },
      },
      locked: {
        on: {
          RESET: {
            target: "idle",
            actions: [() => ({ wrong: 0 })],
          },
        },
      },
    },
  });

  log("候选转换按序匹配：正确密码放行，连续错 3 次锁定", "info");

  const submit = (code: string): void => {
    const before = machine.get();
    const after = machine.send({ type: "SUBMIT", code });
    log(
      `SUBMIT ${code || "（空）"} → ${before.value} → ${after.value}，wrong ${after.context.wrong}`,
      after.value === "granted" || after.value === "locked" ? "write" : "error",
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
        label: "wrong",
        read: () => String(machine.get().context.wrong),
      },
    ],
    actions: [
      {
        id: "submit",
        label: "SUBMIT",
        primary: true,
        input: {
          kind: "text" as const,
          placeholder: "输入 PIN（正确密码 1234）",
          value: "",
        },
        run: submit,
      },
      {
        id: "reset",
        label: "RESET",
        run: () => {
          machine.send({ type: "RESET" });
          log("send RESET → idle，wrong 归零", "write");
        },
      },
    ],
    dispose: () => machine.destroy(),
  };
}
