/**
 * @file atom hook：把 @slux/atom 的可读/可写 atom 经 useSyncExternalStore 接入 Preact，提供 useAtomValue / useSetAtom / useAtom。
 */

import { useCallback } from "preact/hooks";
import { useSyncExternalStore } from "preact/compat";
import { effect } from "@slux/core";
import type { Atom, AnyReadableAtom } from "@slux/atom";

/**
 * 订阅可读 atom 并返回当前值，值变化时触发重渲染。
 * 除 source.subscribe 外还建立 core effect：computed 派生值只在被读取时才刷新并通知，
 * effect 把其依赖变化接入订阅链，保证派生值更新也能驱动重渲染。
 * @typeParam T atom 承载的值类型
 * @param source 任意可读 atom（含派生 atom），应传入稳定引用
 * @returns 当前值
 * @remarks 卸载或 source 引用变化时按「先退订 source、再 dispose effect」清理；SSR 阶段以 getSnapshot 作为服务端快照
 * @see useAtom
 * @see useSetAtom
 */
export function useAtomValue<T>(source: AnyReadableAtom<T>): T {
  const subscribe = useCallback(
    (notify: () => void) => {
      const unsubscribe = source.subscribe(notify);
      const dispose = effect(() => {
        source.get();
      });
      return () => {
        unsubscribe();
        dispose();
      };
    },
    [source],
  );
  const getSnapshot = useCallback(() => source.get(), [source]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
/**
 * 只返回写入函数、不订阅值变化，适用于「只写不读」的组件以避免无谓重渲染。
 * @typeParam T atom 承载的值类型
 * @param source 可写 atom，引用变化会生成新的 setter
 * @returns 写入函数，调用时同步执行 source.set(value)
 * @see useAtom
 * @see useAtomValue
 */
export function useSetAtom<T>(source: Atom<T>): (value: T) => void {
  return useCallback((value: T) => source.set(value), [source]);
}
/**
 * 订阅可写 atom，返回「当前值 + 写入函数」二元组，等价于组合 useAtomValue 与 useSetAtom。
 * @typeParam T atom 承载的值类型
 * @param source 可读可写的 atom，应传入稳定引用
 * @returns 长度为 2 的元组：下标 0 为当前值，下标 1 为写入函数
 * @see useAtomValue
 * @see useSetAtom
 */
export function useAtom<T>(source: Atom<T>): [T, (value: T) => void] {
  return [useAtomValue(source), useSetAtom(source)];
}
