import { REF_MARKER } from "./types.js";
import type { Ref } from "./types.js";

export function ref<T>(value: T): Ref<T> {
  return { current: value, [REF_MARKER]: true };
}

export function isRef(value: object): boolean {
  return REF_MARKER in value;
}
