/**
 * @file Ripple 适配层的 RxJS 桥接 hook：把 @slux/rxjs 的 ObservableState 包装为 Derived<T>。
 */

import { useExternal } from "./external.js";
import type { ObservableState } from "@slux/rxjs";
import type { Derived } from "ripple";

/**
 * 把 ObservableState 转换为 Ripple 的 Derived；值变化经 useExternal 触发派生值更新。
 * @typeParam T ObservableState 承载的值类型
 * @param source ObservableState 实例，应传入稳定引用
 * @returns Derived<T>
 * @see useExternal
 */
export function useObservable<T>(source: ObservableState<T>): Derived<T> {
  return useExternal(
    () => source.get(),
    (notify) => source.subscribe(notify),
  );
}
