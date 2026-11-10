import type { Subscribable } from "@slux/core";

export interface MachineSnapshot<Context, State extends string> {
  readonly value: State;
  readonly context: Context;
}

export type MachineGuard<Context, Event extends { type: string }> = (context: Context, event: Event) => boolean;
export type MachineAction<Context, Event extends { type: string }> = (context: Context, event: Event) => Context | void;

export interface MachineTransition<Context, Event extends { type: string }, State extends string> {
  target?: State;
  guard?: MachineGuard<Context, Event>;
  actions?: MachineAction<Context, Event> | readonly MachineAction<Context, Event>[];
}

export type MachineTransitionConfig<Context, Event extends { type: string }, State extends string> =
  State | MachineTransition<Context, Event, State>;

export interface MachineStateConfig<Context, Event extends { type: string }, State extends string> {
  on?: {
    [Type in Event["type"]]?:
      | MachineTransitionConfig<Context, Extract<Event, { type: Type }>, State>
      | readonly MachineTransitionConfig<Context, Extract<Event, { type: Type }>, State>[];
  };
}

export interface MachineConfig<Context, Event extends { type: string }, State extends string> {
  initial: State;
  context: Context;
  states: Record<State, MachineStateConfig<Context, Event, State>>;
}

export interface StateMachine<Context, Event extends { type: string }, State extends string> extends Subscribable<
  MachineSnapshot<Context, State>
> {
  send(event: Event): MachineSnapshot<Context, State>;
  matches(state: State): boolean;
  can(event: Event): boolean;
  destroy(): void;
}
