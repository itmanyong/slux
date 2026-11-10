import { getCurrentInstance, getCurrentScope, onMounted, onScopeDispose, shallowReadonly, shallowRef } from "vue";
import type { Ref } from "vue";
import { effect } from "@slux/core";
import type { Subscribable } from "@slux/core";

export function useSignal<T>(source: Subscribable<T>): Readonly<Ref<T>> {
  if (!getCurrentScope()) throw new Error("useSignal 必须在 Vue setup 或 effectScope 中调用");
  const value = shallowRef<T>(source.get());
  const start = () => {
    const unsubscribe = source.subscribe((next) => {
      value.value = next;
    });
    // computed 需要主动求值；真正的通知仍走 subscribe，兼容外部 Subscribable。
    const dispose = effect(() => {
      source.get();
    });
    value.value = source.get();
    return () => {
      unsubscribe();
      dispose();
    };
  };
  let stop: (() => void) | undefined;
  // SSR 不执行 mounted，避免为一次性服务端渲染留下订阅。
  if (getCurrentInstance())
    onMounted(() => {
      stop = start();
    });
  else stop = start();
  onScopeDispose(() => stop?.());
  return shallowReadonly(value);
}
