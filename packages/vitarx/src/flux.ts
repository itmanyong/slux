/**
 * @file vitarx 适配层：把 @slux/flux 的 FluxStore 桥接为 vitarx 侧的只读 ShallowRef。
 */
import { useSignal } from "./use-signal.js";
import type { FluxAction, FluxStore } from "@slux/flux";
import type { ShallowRef } from "vitarx";

/**
 * 把 FluxStore 桥接为 vitarx 的只读 ShallowRef，状态读取与变更订阅统一委托给 useSignal。
 * @typeParam State store 持有的状态类型
 * @typeParam Action 受 FluxAction 约束的 action 联合类型，仅用于刻画 store 类型，本 hook 不派发 action
 * @param store FluxStore 实例
 * @returns 只读引用，随所在作用域释放失效
 * @see useSignal 订阅与刷新链路的实现处
 */
export function useFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Readonly<ShallowRef<State>> {
  return useSignal(store);
}
