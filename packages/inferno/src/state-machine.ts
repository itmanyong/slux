import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import type { InfernoNode } from "inferno";
import { SignalValue } from "./index.js";

export type MachineValueProps<Context, Event extends { type: string }, State extends string> = {
  source: StateMachine<Context, Event, State>;
  children: (value: MachineSnapshot<Context, State>) => InfernoNode;
};

export class MachineValue<Context, Event extends { type: string }, State extends string> extends SignalValue<
  MachineSnapshot<Context, State>,
  MachineValueProps<Context, Event, State>
> {}
