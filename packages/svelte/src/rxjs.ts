import type { Readable } from "svelte/store";
import type { ObservableState } from "@slux/rxjs";
import { toReadable } from "./signal.js";

export function toObservableStore<T>(source: ObservableState<T>): Readable<T> {
  return toReadable(source);
}
