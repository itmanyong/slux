import type { Signal } from "@angular/core";
import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import { toAngularSignal } from "./bridge.js";
import type { ToAngularSignalOptions } from "./bridge.js";

export function injectMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
  options?: ToAngularSignalOptions<MachineSnapshot<Context, State>>,
): Signal<MachineSnapshot<Context, State>> {
  return toAngularSignal(machine, options);
}
