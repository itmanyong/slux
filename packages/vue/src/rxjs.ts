import type { Ref } from "vue";
import type { ObservableState } from "@slux/rxjs";
import { useSignal } from "./use-signal.js";

export function useObservable<T>(source: ObservableState<T>): Readonly<Ref<T>> {
  return useSignal(source);
}
