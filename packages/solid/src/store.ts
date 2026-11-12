/**
 * @file 把 @slux/store 的 StoreApi 适配为含 get / subscribe 的对象，经 useSignal
 * 包装为 Solid Accessor，提供整状态与带选择器两种重载。
 */

import type { Accessor } from "solid-js";
import type { StoreApi } from "@slux/store";
import { useSignal } from "./use-signal.js";

/**
 * 读取整个 store 状态的重载：不传 selector 时返回 Accessor<T>。
 * @typeParam T store 状态类型。
 * @param store StoreApi 实例；应传入稳定引用。
 * @returns Accessor<T> 读取函数。
 * @remarks 订阅建立与清理、owner 约束及 SSR 边界均由 useSignal 承担。
 */
export function useStore<T>(store: StoreApi<T>): Accessor<T>;
/**
 * 带选择器读取派生值的重载：selector 从状态中选取 U，equals 判定两次结果是否等价。
 * @typeParam T store 状态类型。
 * @typeParam U selector 的输出类型，也是 Accessor 的返回值类型。
 * @param store StoreApi 实例；应传入稳定引用。
 * @param selector 从 T 映射到 U 的函数。
 * @param equals 比较上一次与本次选择结果的函数；省略时默认 Object.is。
 * @returns Accessor<U> 读取函数。
 */
export function useStore<T, U>(store: StoreApi<T>, selector: (state: T) => U, equals?: (a: U, b: U) => boolean): Accessor<U>;
/**
 * useStore 的实现签名：合并整状态与带选择器两条路径。
 * selector 缺省时以恒等函数回退（配合 U = T 默认泛型）；用局部变量 current 缓存上一次
 * 选择结果，每次 read 重算候选值，仅在 equals 判不等时更新，让 get 在等价结果间返回稳定引用。
 * @typeParam T store 状态类型。
 * @typeParam U 选择结果类型，默认取 T（无 selector 时）。
 * @param store StoreApi 实例；应传入稳定引用。
 * @param selector 可选的派生函数；为空时回退为恒等映射。
 * @param equals 选择结果的等价比较器，默认 Object.is。
 * @returns Accessor<U> 读取函数，订阅生命周期由 useSignal 管理。
 */
export function useStore<T, U = T>(store: StoreApi<T>, selector?: (state: T) => U, equals: (a: U, b: U) => boolean = Object.is): Accessor<U> {
  const select = selector ?? ((state: T) => state as unknown as U);
  let current = select(store.getState());

  const read = () => {
    const next = select(store.getState());
    // 仅在 equals 判不等时更新缓存，保持等价结果的引用稳定。
    if (!equals(current, next)) current = next;
    return current;
  };

  return useSignal({
    get: read,
    subscribe: (callback) => store.subscribe(() => callback(read())),
  });
}
