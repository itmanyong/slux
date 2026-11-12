/**
 * @file 把 @slux/proxy 源对象的快照注入为 Angular 的 Signal。
 */

import type { Signal } from "@angular/core";
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { toAngularSignal } from "./bridge.js";
import type { ToAngularSignalOptions } from "./bridge.js";

/**
 * 把 proxy 源对象的快照转换为 Angular 的 Signal<Snapshot<T>>。
 * 通过一个内联的「可读原子形态」适配器桥接：get 取当前快照，subscribe 在源对象变化时回传新快照，
 * 再委托 toAngularSignal 完成 Signal 转换与订阅清理。
 * @typeParam T 源对象类型，约束为 object
 * @param source 被读取的 proxy 源对象
 * @param options 可选的转换配置；为 undefined 时由 toAngularSignal 采用其默认行为
 * @returns 只读 Signal<Snapshot<T>>，订阅由 toAngularSignal 在生命周期结束时清理
 * @remarks 每次读取或通知前都重新调用 snapshot(source) 取最新快照，避免复用过期快照。
 * @see toAngularSignal 实际执行转换与订阅清理的实现
 */
export function injectSnapshot<T extends object>(source: T, options?: ToAngularSignalOptions<Snapshot<T>>): Signal<Snapshot<T>> {
  return toAngularSignal(
    {
      /** 读取当前值：从 source 生成当前快照。 */
      get: () => snapshot(source),
      /**
       * 订阅变化：把源对象的订阅包装为原子订阅形态。
       * @param notify 变化时以新快照调用的回调
       * @returns 取消订阅句柄
       */
      subscribe: (notify) => subscribe(source, () => notify(snapshot(source))),
    },
    options,
  );
}
