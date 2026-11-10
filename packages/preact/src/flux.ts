import type { FluxStore } from "@slux/flux";
import { useSignal } from "./index.js";

export function useFluxStore<State, Action extends { type: string }>(store: FluxStore<State, Action>): State {
  return useSignal(store);
}
