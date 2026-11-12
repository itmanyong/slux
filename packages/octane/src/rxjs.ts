/**
 * @file octane 适配层的 Observable hook：把 ObservableState 的当前值经 useSignal 暴露给组件。
 */

import type { ObservableState } from "@slux/rxjs";
import { useSignal } from "./index.js";

/**
 * 读取 ObservableState<T> 的当前值，委托给 useSignal 并透传可选的 slot。
 * @typeParam T Observable 发射的值类型
 * @param source 待读取的 ObservableState 实例
 * @param slot 可选的 symbol 槽标识，原样转发给 useSignal
 * @returns 当前值 T
 * @remarks 订阅的建立与清理由 useSignal 管理，调用方无需手动退订
 * @see useSignal 实际执行订阅与清理的入口
 * @see useFluxStore 配对的 Flux store 读取入口
 */
export function useObservable<T>(source: ObservableState<T>, slot?: symbol): T {
  return useSignal(source, slot);
}
