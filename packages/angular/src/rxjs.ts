/**
 * @file 把 @slux/rxjs 的 ObservableState 注入为 Angular 的 Signal。
 */

import type { Signal } from "@angular/core";
import type { ObservableState } from "@slux/rxjs";
import { toAngularSignal } from "./bridge.js";
import type { ToAngularSignalOptions } from "./bridge.js";

/**
 * 把 ObservableState<T> 转换为 Angular 的 Signal<T>，供调用方读取当前值。
 * @typeParam T Observable 发射的值类型，也是返回 Signal 的值类型
 * @param source 待转换的 ObservableState 实例
 * @param options 可选的转换配置；为 undefined 时由 toAngularSignal 采用其默认行为
 * @returns 只读 Signal<T>，订阅的建立与清理由 toAngularSignal 管理
 * @see toAngularSignal 实际执行转换与订阅清理的实现
 * @see injectFluxStore 配对的 Flux store 读取信号入口
 * @see injectAtomValue 配对的原子读取信号入口
 */
export function injectObservable<T>(source: ObservableState<T>, options?: ToAngularSignalOptions<T>): Signal<T> {
  return toAngularSignal(source, options);
}
