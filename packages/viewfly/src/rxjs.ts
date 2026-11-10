import { useSignal } from "./use-signal.js";
import type { ObservableState } from "@slux/rxjs";
import type { Accessor } from "./binding.js";

export function useObservable<T>(source: ObservableState<T>): Accessor<T> {
  return useSignal(source);
}
