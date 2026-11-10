import { useSignal } from "./use-signal.js";
import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import type { Accessor } from "./binding.js";

export function useMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
): Accessor<MachineSnapshot<Context, State>> {
  return useSignal(machine);
}
