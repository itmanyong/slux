import { useSignal } from "./use-signal.js";
import type { FluxAction, FluxStore } from "@slux/flux";
import type { ShallowRef } from "vitarx";

export function useFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Readonly<ShallowRef<State>> {
  return useSignal(store);
}
