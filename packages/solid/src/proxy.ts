/**
 * @file 把 @slux/proxy 的 snapshot / subscribe 适配为含 get / subscribe 的对象，
 * 经 useSignal 包装为 Solid 的 Accessor<Snapshot<T>>。
 */

import type { Accessor } from "solid-js";
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { useSignal } from "./use-signal.js";

/**
 * 订阅代理对象并返回一个 Solid Accessor；调用该 Accessor 取得当前快照。
 * proxy 只暴露 snapshot / subscribe 两个自由函数，这里就地构造含 get / subscribe
 * 的对象交给 useSignal。
 * @typeParam T 被代理的对象类型；快照类型由 Snapshot<T> 映射。
 * @param proxy 由 @slux/proxy 创建的代理对象；应传入稳定引用。
 * @returns Accessor<Snapshot<T>> 读取函数，订阅生命周期由 useSignal 管理。
 * @see useSignal
 */
export function useSnapshot<T extends object>(proxy: T): Accessor<Snapshot<T>> {
  return useSignal({
    get: () => snapshot(proxy),
    subscribe: (callback) => subscribe(proxy, () => callback(snapshot(proxy))),
  });
}
