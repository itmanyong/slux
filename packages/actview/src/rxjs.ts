import { useSignal } from "./use-signal.js";
import type { ObservableState } from "@slux/rxjs";
import type { Ref } from "@actview/core";

export function useObservable<T>(source: ObservableState<T>): Readonly<Ref<T>> {
  return useSignal(source);
}
