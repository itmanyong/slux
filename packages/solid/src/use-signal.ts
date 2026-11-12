/**
 * @file 把 @slux/core 的 Subscribable 桥接为 Solid Accessor 的核心 hook，
 * 供 atom / flux / rxjs / state-machine / proxy 等适配 hook 复用。
 */

import { createSignal, getOwner, onCleanup } from "solid-js";
import type { Accessor } from "solid-js";
import { isServer } from "solid-js/web";
import { effect } from "@slux/core";
import type { Subscribable } from "@slux/core";

/**
 * 把任意 Subscribable 桥接为 Solid 的 Accessor；调用该 Accessor 才取得当前值。
 * @typeParam T Subscribable 承载的值类型。
 * @param source 可读且可订阅的数据源；调用时即被读取与订阅。
 * @returns Accessor<T> 读取函数。
 * @throws 无响应式 owner（不在组件或 createRoot 内）时抛出 Error。
 * @remarks 用 createSignal 保存外部源的值，由 source.subscribe 把变更写入 signal；
 *          额外建立 core effect 主动刷新惰性 computed，通知统一由 subscribe 送入 Solid。
 *          必须在 Solid 组件或 createRoot 的 owner 内调用；服务端（isServer）只返回初始
 *          signal 而不订阅；清理时先退订 source、再 dispose effect。
 * @see onCleanup
 */
export function useSignal<T>(source: Subscribable<T>): Accessor<T> {
  // 无 owner 时无法注册 onCleanup，提前抛错而非静默失效。
  if (!getOwner()) throw new Error("useSignal 必须在 Solid 组件或 createRoot 中调用");
  const [value, setValue] = createSignal(source.get());

  if (isServer) return value;

  // setValue 以函数形式包装新值，避免 next 本身是函数时被当作更新器。
  const unsubscribe = source.subscribe((next) => setValue(() => next));
  const dispose = effect(() => {
    source.get();
  });

  // 补齐订阅建立期间可能错过的变更。
  setValue(() => source.get());
  onCleanup(() => {
    unsubscribe();
    dispose();
  });
  return value;
}
