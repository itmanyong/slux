/**
 * @file 把 @slux/flux 的 store 注入为 Angular 的 Signal。
 */

import type { Signal } from "@angular/core";
import type { FluxAction, FluxStore } from "@slux/flux";
import { toAngularSignal } from "./bridge.js";
import type { ToAngularSignalOptions } from "./bridge.js";

/**
 * 把 FluxStore 的状态转换为 Angular 的 Signal<State>，供调用方读取当前状态。
 * @typeParam State store 持有的状态类型，也是返回 Signal 的值类型
 * @typeParam Action store 接受的动作类型，约束为 FluxAction
 * @param store 待转换的 FluxStore 实例
 * @param options 可选的转换配置；为 undefined 时由 toAngularSignal 采用其默认行为
 * @returns 只读 Signal<State>，订阅的建立与清理由 toAngularSignal 管理
 * @see toAngularSignal 实际执行转换与订阅清理的实现
 * @see injectAtomValue 配对的原子读取信号入口
 */
export function injectFluxStore<State, Action extends FluxAction>(
  store: FluxStore<State, Action>,
  options?: ToAngularSignalOptions<State>,
): Signal<State> {
  return toAngularSignal(store, options);
}
