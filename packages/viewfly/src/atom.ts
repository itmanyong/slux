/**
 * @file 把 @slux/atom 的 Atom/ReadonlyAtom 桥接为 viewfly 侧的 Accessor：读取与订阅委托给 useSignal，写入直接转发 atom.set。
 */
import type { Atom, ReadonlyAtom } from "@slux/atom";
import type { Accessor } from "./binding.js";
import { useSignal } from "./use-signal.js";
/**
 * 将只读 atom 桥接为 viewfly 的 Accessor，值的读取与变更订阅全部委托给 useSignal。
 * @typeParam T atom 承载的值类型，同时决定 Accessor 的值类型
 * @param atom 只读 atom 实例
 * @returns Accessor<T> 访问器（定义见 ./binding.js），随作用域释放失效
 * @remarks 作为 hook 须在每次渲染的固定位置调用，以保证订阅配对稳定。
 * @see useSetAtom 配对的写入端；useAtom 一次性返回读写两端
 */
export function useAtomValue<T>(atom: ReadonlyAtom<T>): Accessor<T> {
  return useSignal(atom);
}
/**
 * 生成把值写回 atom 的 setter 回调，供事件处理或副作用中更新状态使用。
 * @typeParam T atom 的值类型，也是 setter 的唯一入参类型
 * @param atom 可写 atom 实例
 * @returns (value: T) => void 形式的 setter，可在渲染上下文之外调用
 * @remarks setter 每次调用执行一次 atom.set 并通知该 atom 的订阅者。
 * @see useAtomValue 配对的读取端；useAtom 一次性返回读写两端
 */
export function useSetAtom<T>(atom: Atom<T>): (value: T) => void {
  return (value) => atom.set(value);
}
/**
 * 组合读取 Accessor 与写入 setter，以只读二元组形式暴露 atom 的完整读写能力。
 * @typeParam T atom 的值类型
 * @param atom 可写 atom 实例
 * @returns 只读二元组 [Accessor<T>, setter]
 * @remarks 依次调用 useAtomValue 与 useSetAtom，两者在每次渲染中的调用顺序必须稳定，否则会错乱 useSignal 的订阅配对。
 * @see useAtomValue 元组第 0 项来源；useSetAtom 元组第 1 项来源
 */
export function useAtom<T>(atom: Atom<T>): readonly [Accessor<T>, (value: T) => void] {
  return [useAtomValue(atom), useSetAtom(atom)];
}
