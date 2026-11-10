import type { Ref } from "vue";
import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import { useSignal } from "./use-signal.js";

export function useMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
): Readonly<Ref<MachineSnapshot<Context, State>>> {
  return useSignal(machine);
}
