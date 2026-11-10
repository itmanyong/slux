import { useSignal } from "./use-signal.js";
import type { FluxAction, FluxStore } from "@slux/flux";
import type { Ref } from "@actview/core";

export function useFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Readonly<Ref<State>> {
  return useSignal(store);
}
