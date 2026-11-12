/**
 * @file Ripple 外部源桥接核心：把「读取 + 订阅」两个回调桥接为 Ripple 的 Derived，
 * 供 atom / flux / rxjs / proxy / state-machine / store 等适配 hook 复用。
 */

import { effect, track } from "ripple";
import type { Derived } from "ripple";

/**
 * 把外部可读源桥接为 Ripple 的 Derived：read 提供当前值，subscribe 注册变更通知与清理。
 * @typeParam T 外部源承载的值类型，可为函数类型
 * @param read 读取当前值的无参函数，不应有额外副作用
 * @param subscribe 注册订阅的函数：入参为通知回调，返回取消订阅函数
 * @returns Derived<T> 只读派生值
 * @remarks 值以 { value: ... } 对象包装后再交给 track，避免 T 本身为函数时被误当作派生计算；
 *          订阅在 effect 内建立并立即刷新一次以补齐建立期间的变更，退订函数作为 effect 清理返回。
 * @see track
 * @see effect
 */
export function useExternal<T>(read: () => T, subscribe: (notify: () => void) => () => void): Derived<T> {
  // 包裹函数值，避免 track 将用户函数误当作派生计算执行。
  const state = track({ value: read() });

  effect(() => {
    const refresh = () => {
      // 每次创建新对象赋值，确保响应式系统检测到变化。
      state.value = { value: read() };
    };
    const unsubscribe = subscribe(refresh);
    // 补齐订阅建立期间可能发生的变更。
    refresh();
    return unsubscribe;
  });

  return track(() => state.value.value);
}
