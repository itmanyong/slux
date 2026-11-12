/**
 * @file 把 @slux/atom 的可读/可写 atom 包装为 Vue 的 Readonly<Ref<T>> 与写入函数。
 */

import type { Ref } from "vue";
import type { AnyReadableAtom, Atom } from "@slux/atom";
import { useSignal } from "./use-signal.js";

/**
 * 订阅可读 atom 并返回一个只读的 Vue Ref；读取其 .value 才取得当前值。
 * @typeParam T atom 承载的值类型，也是 Ref 的值类型
 * @param atom 任意可读 atom（含派生 atom），应传入稳定引用
 * @returns 只读 Ref<T>，订阅生命周期由 useSignal 管理
 * @see useSignal
 * @see useAtom
 */
export function useAtomValue<T>(atom: AnyReadableAtom<T>): Readonly<Ref<T>> {
  return useSignal(atom);
}
/**
 * 只返回写入函数、不建立订阅，适用于「只写不读」的场景。
 * @typeParam T atom 承载的值类型
 * @param atom 可写 atom
 * @returns 写入函数 (value: T) => void，调用时同步执行 atom.set(value)
 * @see useAtom
 * @see useAtomValue
 */
export function useSetAtom<T>(atom: Atom<T>): (value: T) => void {
  return (value) => atom.set(value);
}
/**
 * 订阅可写 atom，返回「只读 Ref + 写入函数」二元组，等价于组合 useAtomValue 与 useSetAtom。
 * @typeParam T atom 承载的值类型
 * @param atom 可读可写的 atom，应传入稳定引用
 * @returns 第 0 项为只读 Ref<T>，第 1 项为写入函数；订阅生命周期由 useSignal 管理
 * @see useAtomValue
 * @see useSetAtom
 */
export function useAtom<T>(atom: Atom<T>): [Readonly<Ref<T>>, (value: T) => void] {
  return [useAtomValue(atom), useSetAtom(atom)];
}
