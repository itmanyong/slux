import type { ObservableState } from "@slux/rxjs";
import type { InfernoNode } from "inferno";
import { SignalValue } from "./index.js";

export type ObservableValueProps<T> = {
  source: ObservableState<T>;
  children: (value: T) => InfernoNode;
};

export class ObservableValue<T> extends SignalValue<T, ObservableValueProps<T>> {}
