import { useExternal } from "./external.js";
import type { FluxAction, FluxStore } from "@slux/flux";
import type { Derived } from "ripple";

export function useFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Derived<State> {
  return useExternal(
    () => store.get(),
    (notify) => store.subscribe(notify),
  );
}
