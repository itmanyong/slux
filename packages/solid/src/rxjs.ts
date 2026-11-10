import type { Accessor } from "solid-js";
import type { ObservableState } from "@slux/rxjs";
import { useSignal } from "./use-signal.js";

export function useObservable<T>(source: ObservableState<T>): Accessor<T> {
  return useSignal(source);
}
