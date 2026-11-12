/**
 * @file 把 @slux/flux 的 FluxStore 桥接为 viewfly 侧的 Accessor：状态读取与变更订阅委托给 useSignal，派发逻辑由 store 自身承担。
 */
import { useSignal } from "./use-signal.js";
import type { FluxAction, FluxStore } from "@slux/flux";
import type { Accessor } from "./binding.js";

/**
 * 把 FluxStore 桥接为 viewfly 的 Accessor，状态读取与变更订阅统一委托给 useSignal，使 flux 状态与其他 signal 共享同一套刷新时序。
 * @typeParam State store 持有的状态类型，决定 Accessor 的值类型
 * @typeParam Action 受 FluxAction 约束的 action 联合类型，仅用于刻画 store 类型
 * @param store FluxStore 实例
 * @returns Accessor<State> 访问器，随作用域释放失效
 * @remarks 本 hook 不派发 action；dispatch 后的状态刷新经 useSignal 订阅链路到达 Accessor。
 * @see useSignal 订阅与刷新链路的实现处；@slux/flux 的 FluxStore 定义
 */
export function useFluxStore<State, Action extends FluxAction>(store: FluxStore<State, Action>): Accessor<State> {
  return useSignal(store);
}
