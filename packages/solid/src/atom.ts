/**
 * @file 把 @slux/atom 的可读/可写 atom 包装为 Solid Accessor 与写入函数，
 * 提供 useAtomValue / useSetAtom / useAtom。
 */

import type { Accessor } from "solid-js";
import type { AnyReadableAtom, Atom } from "@slux/atom";
import { useSignal } from "./use-signal.js";

/**
 * 订阅可读 atom 并返回一个 Solid Accessor；调用该 Accessor 才取得当前值。
 * 仅做类型化转发，让 atom 与各框架适配层共用同一套 signal 读取语义。
 * @typeParam T atom 承载的值类型。
 * @param atom 任意可读 atom（含派生 atom）；应传入稳定引用。
 * @returns Accessor<T> 读取函数，订阅生命周期由 useSignal 管理。
 * @see useSignal
 * @see useAtom
 */
export function useAtomValue<T>(atom: AnyReadableAtom<T>): Accessor<T> {
  return useSignal(atom);
}
/**
 * 只返回写入函数、不建立订阅，适用于「只写不读」的场景。
 * @typeParam T atom 承载的值类型。
 * @param atom 可写 atom。
 * @returns 写入函数，调用时同步执行 atom.set(value)。
 * @remarks 每次调用返回新的写入闭包，不引入缓存。
 * @see useAtom
 * @see useAtomValue
 */
export function useSetAtom<T>(atom: Atom<T>): (value: T) => void {
  return (value) => atom.set(value);
}
/**
 * 订阅可写 atom，返回「Accessor + 写入函数」二元组，等价于组合 useAtomValue 与 useSetAtom。
 * @typeParam T atom 承载的值类型。
 * @param atom 可读可写的 atom；应传入稳定引用。
 * @returns 元组：下标 0 为 Accessor<T>，下标 1 为写入函数。
 * @see useAtomValue
 * @see useSetAtom
 */
export function useAtom<T>(atom: Atom<T>): [Accessor<T>, (value: T) => void] {
  return [useAtomValue(atom), useSetAtom(atom)];
}
