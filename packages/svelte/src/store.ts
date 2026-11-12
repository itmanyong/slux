/**
 * @file Svelte 适配层的 store 转换函数：把 @slux/store 的 StoreApi 经 svelte/store 的 readable
 * 包装为 Readable，提供整状态与带选择器两种重载。
 */

import { readable } from "svelte/store";
import type { Readable } from "svelte/store";
import type { StoreApi } from "@slux/store";

/**
 * 读取整个 store 状态的重载：不传 selector 时返回 Readable<T>。
 * @typeParam T store 状态类型
 * @param store StoreApi 实例，应传入稳定引用
 * @returns Readable<T>
 * @see toStore 带 selector 的重载
 */
export function toStore<T>(store: StoreApi<T>): Readable<T>;
/**
 * 带选择器读取派生值的重载：selector 从状态中选取 U，equals 判定两次结果是否等价。
 * @typeParam T store 状态类型
 * @typeParam U 选择结果类型，也是 Readable 的值类型
 * @param store StoreApi 实例，应传入稳定引用
 * @param selector 从 T 映射到 U 的函数，每次状态变化都会调用
 * @param equals 比较相邻两次选择结果的函数，省略时回退到 Object.is
 * @returns Readable<U>
 * @remarks 等价结果不会重复推送
 * @see toStore 无 selector 的重载
 */
export function toStore<T, U>(store: StoreApi<T>, selector: (state: T) => U, equals?: (a: U, b: U) => boolean): Readable<U>;
/**
 * toStore 的实现签名：合并整状态与带选择器两条路径。
 * selector 缺省时以恒等函数回退（配合 U = T 默认泛型）；订阅仅在首个订阅者出现时建立、
 * 最后一个订阅者离开时清理，等价结果不重复推送。
 * @typeParam T store 状态类型
 * @typeParam U 选择结果类型，默认取 T（无 selector 时）
 * @param store StoreApi 实例
 * @param selector 可选的派生函数，为空时回退为恒等映射
 * @param equals 选择结果的等价比较器，默认 Object.is
 * @returns Readable<U>
 * @remarks readable 的 start 在首个订阅者出现时执行：先同步一次当前值再建立 store.subscribe，
 *          其返回的取消订阅函数在最后一个订阅者离开时调用；SSR 阶段无订阅者时不建立 store 订阅
 */
export function toStore<T, U = T>(store: StoreApi<T>, selector?: (state: T) => U, equals: (a: U, b: U) => boolean = Object.is): Readable<U> {
  const select = selector ?? ((state: T) => state as unknown as U);

  return readable(select(store.getState()), (set) => {
    let current = select(store.getState());
    set(current);

    return store.subscribe((state) => {
      const next = select(state);
      if (!equals(current, next)) {
        current = next;
        set(next);
      }
    });
  });
}
