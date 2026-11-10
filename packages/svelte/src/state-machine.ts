import type { Readable } from "svelte/store";
import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import { toReadable } from "./signal.js";

export function toMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
): Readable<MachineSnapshot<Context, State>> {
  return toReadable(machine);
}
