import { getCurrentInstance, getCurrentScope, onMounted, onUnmounted, onScopeDispose, shallowRef } from "@actview/core";
import type { Ref } from "@actview/core";

export function bindExternal<T>(
  get: () => T,
  subscribe: (notify: () => void) => () => void,
  equals: (a: T, b: T) => boolean = Object.is,
): Readonly<Ref<T>> {
  const instance = getCurrentInstance();
  if (!instance && !getCurrentScope()) throw new Error("Slux bindings require an active ActView component or effect scope.");
  const value = shallowRef<T>(get());
  const update = () => {
    const next = get();
    if (!equals(value.value, next)) value.value = next;
  };
  const start = () => {
    const dispose = subscribe(update);
    update();
    return dispose;
  };
  if (instance) {
    // SSR 没有 effect scope，也不执行 mounted；只读取初始快照。
    let dispose: (() => void) | undefined;
    onMounted(() => {
      dispose = start();
    });
    onUnmounted(() => dispose?.());
  } else {
    onScopeDispose(start());
  }
  return value;
}
