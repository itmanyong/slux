import { getActiveScope, isSSR, onScopeDispose, shallowRef } from "vitarx";
import type { ShallowRef } from "vitarx";

export function bindExternal<T>(
  get: () => T,
  subscribe: (notify: () => void) => () => void,
  equals: (a: T, b: T) => boolean = Object.is,
): Readonly<ShallowRef<T>> {
  if (isSSR()) return shallowRef<T>(get());
  if (!getActiveScope()) throw new Error("Slux bindings require an active vitarx effect scope.");
  const value = shallowRef<T>(get());
  const update = () => {
    const next = get();
    if (!equals(value.value, next)) value.value = next;
  };
  const dispose = subscribe(update);
  onScopeDispose(dispose);
  update();
  return value;
}
