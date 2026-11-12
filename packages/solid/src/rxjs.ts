/**
 * @file 把 @slux/rxjs 的 ObservableState 经 useSignal 包装为 Solid 的 Accessor<T>。
 */

import type { Accessor } from "solid-js";
import type { ObservableState } from "@slux/rxjs";
import { useSignal } from "./use-signal.js";

/**
 * 订阅 ObservableState 并返回一个 Solid Accessor；调用该 Accessor 才取得当前值。
 * 仅做类型化转发，让 RxJS 与各框架适配层共用同一套 signal 读取语义。
 * @typeParam T ObservableState 承载的值类型。
 * @param source ObservableState 实例；应传入稳定引用。
 * @returns Accessor<T> 读取函数，订阅生命周期由 useSignal 管理。
 * @see useSignal
 */
export function useObservable<T>(source: ObservableState<T>): Accessor<T> {
  return useSignal(source);
}
