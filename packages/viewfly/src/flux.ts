import { useSignal } from "./use-signal.js";
import type { FluxAction, FluxStore } from "@slux/flux";
import type { Accessor } from "./binding.js";

export function useFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Accessor<State> {
  return useSignal(store);
}
