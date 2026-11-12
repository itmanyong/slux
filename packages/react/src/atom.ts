/**
 * @file 把 @slux/atom 的可读/可写 atom 接入 React useSyncExternalStore，
 * 提供 useAtom / useAtomValue / useSetAtom 三个 hook。
 */

import { useCallback, useSyncExternalStore } from "react";
import type { Atom, AnyReadableAtom } from "@slux/atom";

/**
 * 订阅可写 atom，返回「当前值 + 写入函数」二元组，等价于组合 useAtomValue 与 useSetAtom。
 * @param atom 可读可写的 atom；应传入稳定引用，引用变化会重建订阅与 setter。
 * @returns 元组：下标 0 为当前快照值，下标 1 为写入函数（useCallback 缓存）。
 * @see useAtomValue
 * @see useSetAtom
 */
export function useAtom<T>(atom: Atom<T>): [T, (value: T) => void] {
  return [useAtomValue(atom), useSetAtom(atom)];
}

/**
 * 只订阅 atom 的值变化并返回当前快照；需要写入能力时使用 useSetAtom。
 * 直接以 atom.subscribe / atom.get 作为订阅源与快照读取，不引入 core effect：
 * @slux/atom 已负责派生值刷新与变更通知。
 * @param atom 任意可读 atom（含只读派生 atom）；引用变化会重建订阅。
 * @returns 当前快照值 T。
 * @remarks 第三个参数复用 getSnapshot 作为服务端渲染快照，SSR 阶段直接读值而不建立订阅。
 * @see useAtom
 * @see useSetAtom
 */
export function useAtomValue<T>(atom: AnyReadableAtom<T>): T {
  const subscribe = useCallback((onStoreChange: () => void) => atom.subscribe(onStoreChange), [atom]);
  const getSnapshot = useCallback(() => atom.get(), [atom]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * 只返回写入函数、不订阅值变化，适用于「只写不读」的组件以避免无谓重渲染。
 * @param atom 可写 atom；引用变化会生成新的 setter。
 * @returns 写入函数，调用时同步执行 atom.set(value)。
 * @see useAtom
 * @see useAtomValue
 */
export function useSetAtom<T>(atom: Atom<T>): (value: T) => void {
  return useCallback((value: T) => atom.set(value), [atom]);
}
