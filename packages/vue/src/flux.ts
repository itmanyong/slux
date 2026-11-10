import type { Ref } from "vue";
import type { FluxAction, FluxStore } from "@slux/flux";
import { useSignal } from "./use-signal.js";

export function useFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Readonly<Ref<State>> {
  return useSignal(store);
}
