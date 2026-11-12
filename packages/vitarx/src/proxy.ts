/**
 * @file vitarx 适配层：把 @slux/proxy 的代理对象桥接为 vitarx 侧的快照 ShallowRef 只读引用。
 */
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import type { ShallowRef } from "vitarx";
import { bindExternal } from "./binding.js";
/**
 * 把代理对象的当前快照暴露为 vitarx 的只读 ShallowRef，变更时经订阅刷新。
 * @typeParam T 代理对象类型，受 object 约束；决定快照类型 Snapshot<T>
 * @param proxy @slux/proxy 的代理对象；传入非代理对象时行为由 snapshot/subscribe 决定
 * @returns 只读引用，随所在作用域释放失效
 * @see bindExternal 外部源的绑定与生命周期实现
 */
export function useSnapshot<T extends object>(proxy: T): Readonly<ShallowRef<Snapshot<T>>> {
  return bindExternal(
    () => snapshot(proxy),
    (notify) => subscribe(proxy, notify),
  );
}
