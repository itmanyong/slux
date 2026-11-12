/**
 * @file Ripple 适配层主入口：定义核心 hook useSignal，并汇总 scope 与自动导入 API 的对外符号。
 */

import { effect } from "@slux/core";
import type { Subscribable } from "@slux/core";
import type { Derived } from "ripple";
import { useExternal } from "./external.js";

export { ScopeContext, provideScope, useScopeContext } from "./scope.js";

/**
 * 把任意 Subscribable 桥接为 Ripple 的 Derived；值变化经 useExternal 触发派生值更新。
 * @typeParam T source 承载的值类型
 * @param source 可读且可订阅的数据源，应传入稳定引用
 * @returns Derived<T>
 * @remarks 清理按「先退订 source、再 dispose effect」的逆序执行。
 * @see useExternal
 */
export function useSignal<T>(source: Subscribable<T>): Derived<T> {
  return useExternal(
    () => source.get(),
    (notify) => {
      const unsubscribe = source.subscribe(notify);
      // computed 需要活跃读取才能向订阅者发布最新值。
      const dispose = effect(() => {
        source.get();
      });
      return () => {
        unsubscribe();
        dispose();
      };
    },
  );
}
export { createAutoImportApis } from "./auto-import-api.js";
