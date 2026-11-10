import type { Readable } from "svelte/store";
import type { FluxAction, FluxStore } from "@slux/flux";
import { toReadable } from "./signal.js";

export function toFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Readable<State> {
  return toReadable(store);
}
