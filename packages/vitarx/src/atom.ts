/**
 * @file vitarx 适配层：把 @slux/atom 的 Atom 桥接为 vitarx 侧的只读 ShallowRef 与写入回调。
 */
import type { Atom, ReadonlyAtom } from "@slux/atom";
import type { ShallowRef } from "vitarx";
import { useSignal } from "./use-signal.js";
/**
 * 将只读 atom 桥接为 vitarx 的只读 ShallowRef，值的读取与变更订阅全部委托给 useSignal。
 * @typeParam T atom 承载的值类型
 * @param atom 只读 atom 实例
 * @returns 只读引用，随所在作用域释放失效
 * @see useSetAtom 配对的写入端；useAtom 一次性返回读写两端
 */
export function useAtomValue<T>(atom: ReadonlyAtom<T>): Readonly<ShallowRef<T>> {
  return useSignal(atom);
}
/**
 * 生成把值写回 atom 的 setter 回调，供事件处理或副作用中更新状态。
 * setter 与传入的 atom 固定绑定，调用方无需再持有该 atom 即可写入。
 * @typeParam T atom 的值类型
 * @param atom 可写 atom 实例
 * @returns setter 函数，可在渲染上下文之外调用
 * @see useAtomValue 配对的读取端；useAtom 一次性返回读写两端
 */
export function useSetAtom<T>(atom: Atom<T>): (value: T) => void {
  return (value) => atom.set(value);
}
/**
 * 组合 useAtomValue 与 useSetAtom，以只读二元组形式暴露 atom 的完整读写能力。
 * @typeParam T atom 的值类型
 * @param atom 可写 atom 实例
 * @returns 只读二元组 [只读 ShallowRef<T>, setter]
 * @remarks 两个 hook 的调用顺序须在每次渲染保持稳定，否则会错乱 useSignal 的订阅配对
 * @see useAtomValue 元组第 0 项来源；useSetAtom 元组第 1 项来源
 */
export function useAtom<T>(atom: Atom<T>): readonly [Readonly<ShallowRef<T>>, (value: T) => void] {
  return [useAtomValue(atom), useSetAtom(atom)];
}
