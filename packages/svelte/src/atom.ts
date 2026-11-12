/**
 * @file Svelte 适配层的 atom 转换函数：把 @slux/atom 的可读/可写 atom 包装为 Svelte 的
 * Readable / Writable store。
 */

import type { Readable, Writable } from "svelte/store";
import type { AnyReadableAtom, Atom } from "@slux/atom";
import { toReadable } from "./signal.js";

/**
 * 把可读 atom 包装为 Svelte 的 Readable store，供组件通过订阅读取当前值。
 * @typeParam T atom 承载的值类型
 * @param atom 任意可读 atom（含派生 atom），应传入稳定引用
 * @returns Readable<T>
 * @remarks 仅做类型化转发，订阅的建立与清理、SSR 边界均由 toReadable 承担
 * @see toReadable
 * @see toAtom
 */
export function toAtomValue<T>(atom: AnyReadableAtom<T>): Readable<T> {
  return toReadable(atom);
}
/**
 * 把可写 atom 包装为 Svelte 的 Writable store：订阅复用 toAtomValue，写入委托给 atom.set / atom.update。
 * @typeParam T atom 承载的值类型
 * @param atom 可写 atom，应传入稳定引用
 * @returns Writable<T>（含 subscribe / set / update）
 * @remarks set 与 update 为同步写入，不参与订阅生命周期
 * @see toAtomValue
 * @see toReadable
 */
export function toAtom<T>(atom: Atom<T>): Writable<T> {
  return {
    subscribe: toAtomValue(atom).subscribe,
    set: (value) => atom.set(value),
    update: (fn) => atom.update(fn),
  };
}
