import { useExternal } from "./external.js";
import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import type { Derived } from "ripple";

export function useMachine<Context, Event extends { type: string }, State extends string>(
  machine: StateMachine<Context, Event, State>,
): Derived<MachineSnapshot<Context, State>> {
  return useExternal(
    () => machine.get(),
    (notify) => machine.subscribe(notify),
  );
}
