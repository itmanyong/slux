/**
 * @file 把 @slux/rxjs 的 ObservableState 桥接为 viewfly 侧的 Accessor：当前值读取与变更订阅委托给 useSignal，流的订阅管理由 @slux/rxjs 承担。
 */
import { useSignal } from "./use-signal.js";
import type { ObservableState } from "@slux/rxjs";
import type { Accessor } from "./binding.js";

/**
 * 把 ObservableState 桥接为 viewfly 的 Accessor，当前值读取与后续变更订阅统一委托给 useSignal，使流与其他 signal 共享同一套刷新时序。
 * @typeParam T 流承载的值类型，决定 Accessor 的返回类型
 * @param source ObservableState 实例
 * @returns Accessor<T> 访问器，随作用域释放失效
 * @remarks 本 hook 不创建流、不显式释放订阅；流的发射与订阅管理由 @slux/rxjs 侧承担。
 * @see useSignal 订阅与刷新链路的实现处；@slux/rxjs 的 ObservableState 定义
 */
export function useObservable<T>(source: ObservableState<T>): Accessor<T> {
  return useSignal(source);
}
