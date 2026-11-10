import type { FluxStore } from "@slux/flux";
import type { InfernoNode } from "inferno";
import { SignalValue } from "./index.js";

export type FluxValueProps<State, Action extends { type: string }> = {
  source: FluxStore<State, Action>;
  children: (value: State) => InfernoNode;
};

export class FluxValue<State, Action extends { type: string }> extends SignalValue<State, FluxValueProps<State, Action>> {}
