/**
 * @file RxJS 桥接 hook：useObservable 把 @slux/rxjs 的 ObservableState 经 useSignal 读取为组件状态。
 */

import type { ObservableState } from "@slux/rxjs";
import { useSignal } from "./index.js";

/**
 * 订阅 ObservableState 并返回其当前值，值变化经 useSignal 触发重渲染。
 * 仅做类型化转发，让 RxJS 与各框架适配层共用同一套 signal 读取语义。
 * @typeParam T ObservableState 承载的值类型
 * @param source ObservableState 实例，应传入稳定引用
 * @returns 当前值
 * @see useSignal
 * @see useFluxStore
 */
export function useObservable<T>(source: ObservableState<T>): T {
  return useSignal(source);
}
