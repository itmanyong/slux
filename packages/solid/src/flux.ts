import type { Accessor } from "solid-js";
import type { FluxAction, FluxStore } from "@slux/flux";
import { useSignal } from "./use-signal.js";

export function useFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Accessor<State> {
  return useSignal(store);
}
