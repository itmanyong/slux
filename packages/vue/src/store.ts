/**
 * @file 把 @slux/store 的 StoreApi 经 useSignal 包装为 Vue 的 Readonly<Ref<U>>，
 * 提供整状态与带选择器两种用法。
 */

import type { Ref } from "vue";
import type { StoreApi } from "@slux/store";
import { useSignal } from "./use-signal.js";

/**
 * 读取整个 store 状态的重载。
 * @typeParam T store 状态类型
 * @param store StoreApi 实例，应传入稳定引用
 * @returns 只读 Ref<T>，订阅生命周期由 useSignal 管理
 */
export function useStore<T>(store: StoreApi<T>): Readonly<Ref<T>>;
/**
 * 带选择器读取派生值的重载。
 * @typeParam T store 状态类型
 * @typeParam U 选择结果类型，也是 Ref 的值类型
 * @param store StoreApi 实例，应传入稳定引用
 * @param selector 从 T 映射到 U 的函数，每次读取状态都会调用
 * @param equals 比较上一次与本次选择结果的函数，省略时默认取 Object.is
 * @returns 只读 Ref<U>，订阅生命周期由 useSignal 管理
 */
export function useStore<T, U>(store: StoreApi<T>, selector: (state: T) => U, equals?: (a: U, b: U) => boolean): Readonly<Ref<U>>;
/**
 * useStore 的实现签名：合并整状态与带选择器两条路径。
 * 用局部变量 current 缓存上一次选择结果，每次读取重算候选值、仅在 equals 判不等时更新，
 * 使等价结果间返回稳定引用，避免订阅者被无意义的变更触发。
 * @typeParam T store 状态类型
 * @typeParam U 选择结果类型，默认取 T（无 selector 时）
 * @param store StoreApi 实例
 * @param selector 可选的派生函数，缺省时回退为恒等映射
 * @param equals 等价比较器，默认 Object.is
 * @returns 只读 Ref<U>，订阅生命周期由 useSignal 管理
 */
export function useStore<T, U = T>(
  store: StoreApi<T>,
  selector?: (state: T) => U,
  equals: (a: U, b: U) => boolean = Object.is,
): Readonly<Ref<U>> {
  const select = selector ?? ((state: T) => state as unknown as U);
  let current = select(store.getState());

  const read = () => {
    const next = select(store.getState());
    if (!equals(current, next)) current = next;
    return current;
  };

  return useSignal({
    get: read,
    subscribe: (callback) => store.subscribe(() => callback(read())),
  });
}
