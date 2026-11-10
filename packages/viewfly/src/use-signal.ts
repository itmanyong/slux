import { effect } from "@slux/core";
import type { Subscribable } from "@slux/core";
import { bindExternal } from "./binding.js";
import type { Accessor } from "./binding.js";
export function useSignal<T>(source: Subscribable<T>): Accessor<T> {
  return bindExternal(
    () => source.get(),
    (notify) => {
      const unsubscribe = source.subscribe(notify);
      // core computed 惰性求值，主动读取使依赖变化进入订阅。
      const dispose = effect(() => {
        source.get();
      });
      return () => {
        unsubscribe();
        dispose();
      };
    },
  );
}
