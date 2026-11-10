import { useExternal } from "./external.js";
import type { ObservableState } from "@slux/rxjs";
import type { Derived } from "ripple";

export function useObservable<T>(source: ObservableState<T>): Derived<T> {
  return useExternal(
    () => source.get(),
    (notify) => source.subscribe(notify),
  );
}
