/**
 * @file 把 @slux/rxjs 的 ObservableState 经 useSignal 包装为 Vue 的 Readonly<Ref<T>>。
 */

import type { Ref } from "vue";
import type { ObservableState } from "@slux/rxjs";
import { useSignal } from "./use-signal.js";

/**
 * 订阅 ObservableState 并返回一个只读的 Vue Ref；读取其 .value 才取得当前值。
 * @typeParam T ObservableState 承载的值类型，也是 Ref 的值类型
 * @param source ObservableState 实例，应传入稳定引用
 * @returns 只读 Ref<T>，订阅生命周期由 useSignal 管理
 * @see useSignal
 */
export function useObservable<T>(source: ObservableState<T>): Readonly<Ref<T>> {
  return useSignal(source);
}
