import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import { useSignal } from "./index.js";

export function useMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
  slot?: symbol,
): MachineSnapshot<Context, State> {
  return useSignal(machine, slot);
}
