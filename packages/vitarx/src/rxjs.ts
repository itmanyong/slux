import { useSignal } from "./use-signal.js";
import type { ObservableState } from "@slux/rxjs";
import type { ShallowRef } from "vitarx";

export function useObservable<T>(source: ObservableState<T>): Readonly<ShallowRef<T>> {
  return useSignal(source);
}
