import { effect, track } from "ripple";
import type { Derived } from "ripple";

export function useExternal<T>(read: () => T, subscribe: (notify: () => void) => () => void): Derived<T> {
  // 包裹函数值，避免 track 将用户函数误当作派生计算执行。
  const state = track({ value: read() });
  effect(() => {
    const refresh = () => {
      state.value = { value: read() };
    };
    const unsubscribe = subscribe(refresh);
    refresh();
    return unsubscribe;
  });
  return track(() => state.value.value);
}
