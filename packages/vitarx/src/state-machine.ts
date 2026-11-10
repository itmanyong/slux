import { useSignal } from "./use-signal.js";
import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import type { ShallowRef } from "vitarx";

export function useMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
): Readonly<ShallowRef<MachineSnapshot<Context, State>>> {
  return useSignal(machine);
}
