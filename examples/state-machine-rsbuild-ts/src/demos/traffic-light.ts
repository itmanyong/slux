import { createMachine } from "@slux/state-machine";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

type LightState = "red" | "green" | "yellow";

/** 交通灯：字符串速记转换，事件循环推进状态。 */
export function createTrafficLight({ log }: { log: Log }) {
  const machine = createMachine<void, { type: "NEXT" }, LightState>({
    initial: "red",
    context: undefined,
    states: {
      red: { on: { NEXT: "green" } },
      green: { on: { NEXT: "yellow" } },
      yellow: { on: { NEXT: "red" } },
    },
  });
  const cycle: LightState[] = ["red", "green", "yellow"];

  log("createMachine：red → green → yellow 循环", "info");

  return {
    readouts: [
      {
        kind: "metric" as const,
        label: "state",
        emphasis: true,
        read: () => machine.get().value,
      },
      {
        kind: "flow" as const,
        label: "cycle",
        read: () => {
          const current = machine.get().value;
          return cycle.map((light) => ({
            label: light,
            value: light === current ? "当前" : "待命",
          }));
        },
      },
    ],
    actions: [
      {
        id: "next",
        label: "NEXT",
        primary: true,
        run: () => {
          const before = machine.get().value;
          const after = machine.send({ type: "NEXT" });
          log(`send NEXT：${before} → ${after.value}`, "write");
        },
      },
    ],
    dispose: () => machine.destroy(),
  };
}
