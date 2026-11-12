/**
 * @file 把 @slux/proxy 的代理对象桥接为 actview 侧的只读快照 Ref：快照生成与订阅来自 @slux/proxy，绑定与生命周期由 bindExternal 承担。
 */
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import type { Ref } from "@actview/core";
import { bindExternal } from "./binding.js";
/**
 * 把代理对象的当前快照暴露为 actview 的只读 Ref，变更时经订阅刷新。
 * 复用 bindExternal 统一的外部源绑定层，订阅注册、通知刷新与注销遵循同一套生命周期。
 * @typeParam T 代理对象类型，受 object 约束；决定快照类型 Snapshot<T>
 * @param proxy @slux/proxy 的代理对象
 * @returns 只读 Ref，读取其当前值得到 Snapshot<T> 快照，随作用域释放失效
 * @remarks 传入非代理对象时行为由 @slux/proxy 的 snapshot/subscribe 决定。
 * @see bindExternal 外部源的绑定与生命周期实现；@slux/proxy 的 snapshot、subscribe
 */
export function useSnapshot<T extends object>(proxy: T): Readonly<Ref<Snapshot<T>>> {
  return bindExternal(
    () => snapshot(proxy),
    (notify) => subscribe(proxy, notify),
  );
}
