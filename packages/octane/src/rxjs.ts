import type { ObservableState } from "@slux/rxjs";
import { useSignal } from "./index.js";

export function useObservable<T>(source: ObservableState<T>, slot?: symbol): T {
  return useSignal(source, slot);
}
