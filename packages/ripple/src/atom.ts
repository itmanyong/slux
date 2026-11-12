/**
 * @file Ripple 适配层的 atom hook：把 @slux/atom 的 atom 包装为 Derived 与写入函数。
 */

import type { Atom, AnyReadableAtom } from "@slux/atom";
import type { Derived } from "ripple";
import { useExternal } from "./external.js";

/**
 * 订阅可写 atom，返回「Derived + 写入函数」二元组，等价于组合 useAtomValue 与 useSetAtom。
 * @typeParam T atom 承载的值类型
 * @param atom 可读可写的 atom，应传入稳定引用
 * @returns 元组：下标 0 为 Derived<T>，下标 1 为写入函数
 * @see useAtomValue
 * @see useSetAtom
 */
export function useAtom<T>(atom: Atom<T>): [Derived<T>, (value: T) => void] {
  return [useAtomValue(atom), useSetAtom(atom)];
}

/**
 * 把可读 atom 转换为 Ripple 的 Derived；值变化经 useExternal 触发派生值更新。
 * @typeParam T atom 承载的值类型
 * @param atom 任意可读 atom（含派生 atom），应传入稳定引用
 * @returns Derived<T>
 * @see useExternal
 */
export function useAtomValue<T>(atom: AnyReadableAtom<T>): Derived<T> {
  return useExternal(
    () => atom.get(),
    (notify) => atom.subscribe(notify),
  );
}

/**
 * 只返回写入函数、不建立订阅，适用于「只写不读」的场景。
 * @typeParam T atom 承载的值类型
 * @param atom 可写 atom
 * @returns 写入函数，调用时同步执行 atom.set(value)
 * @see useAtom
 */
export function useSetAtom<T>(atom: Atom<T>): (value: T) => void {
  return (value) => atom.set(value);
}
