import { createSignal, getOwner, onCleanup } from "solid-js";
import type { Accessor } from "solid-js";
import { isServer } from "solid-js/web";
import { effect } from "@slux/core";
import type { Subscribable } from "@slux/core";

export function useSignal<T>(source: Subscribable<T>): Accessor<T> {
  if (!getOwner()) throw new Error("useSignal 必须在 Solid 组件或 createRoot 中调用");
  const [value, setValue] = createSignal(source.get());
  if (isServer) return value;
  const unsubscribe = source.subscribe((next) => setValue(() => next));
  // 主动刷新惰性 computed，通知由 subscribe 统一送入 Solid。
  const dispose = effect(() => {
    source.get();
  });
  setValue(() => source.get());
  onCleanup(() => {
    unsubscribe();
    dispose();
  });
  return value;
}
