import type { ObservableState } from "@slux/rxjs";
import { useSignal } from "./hooks/use-signal.js";

export function useObservable<T>(source: ObservableState<T>): T {
  return useSignal(source);
}
