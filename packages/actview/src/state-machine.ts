import { useSignal } from "./use-signal.js";
import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import type { Ref } from "@actview/core";

export function useMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
): Readonly<Ref<MachineSnapshot<Context, State>>> {
  return useSignal(machine);
}
