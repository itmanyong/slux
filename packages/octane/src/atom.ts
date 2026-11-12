/**
 * @file octane 适配层的原子 hook：读取原子、写入原子，并经 useSyncExternalStore 订阅其变化。
 */

import { useCallback, useSyncExternalStore } from "octane";
import type { Atom, AnyReadableAtom } from "@slux/atom";
import { subSlot } from "./slots.js";

/**
 * 一次性取得原子的当前值与写入函数，以 [值, setter] 元组返回。
 * @typeParam T 原子持有的值类型
 * @param atom 目标可写原子句柄
 * @param slot 可选的 symbol 槽标识，经 subSlot 派生 "atom:value" 与 "atom:setter" 两个用途槽
 * @returns 元组：第 0 项为当前值，第 1 项为写入函数
 * @see useAtomValue 元组第 0 项的来源
 * @see useSetAtom 元组第 1 项的来源
 */
export function useAtom<T>(atom: Atom<T>, slot?: symbol): [T, (value: T) => void] {
  return [useAtomValue(atom, subSlot(slot, "atom:value")), useSetAtom(atom, subSlot(slot, "atom:setter"))];
}

/**
 * 读取原子当前值并订阅其变化，使组件随值更新。
 * @typeParam T 原子持有的值类型
 * @param atom 被读取的可读原子句柄
 * @param slot 可选的 symbol 槽标识
 * @returns 当前值 T
 * @remarks 订阅与读取函数以 [atom] 记忆化；订阅清理由 useSyncExternalStore 管理
 */
export function useAtomValue<T>(atom: AnyReadableAtom<T>, slot?: symbol): T {
  const subscribe = useCallback((notify: () => void) => atom.subscribe(notify), [atom], subSlot(slot, "atom:subscribe"));
  const getSnapshot = useCallback(() => atom.get(), [atom], subSlot(slot, "atom:read"));
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot, subSlot(slot, "atom:store"));
}

/**
 * 生成把 value 写入原子的稳定写入函数。
 * @typeParam T 原子持有的值类型
 * @param atom 目标可写原子句柄
 * @param slot 可选的 symbol 槽标识
 * @returns 形如 (value: T) => void 的写入函数；atom 不变时引用稳定
 * @see useAtom 同时返回值与写入函数的组合入口
 */
export function useSetAtom<T>(atom: Atom<T>, slot?: symbol): (value: T) => void {
  return useCallback((value: T) => atom.set(value), [atom], subSlot(slot, "atom:write"));
}
