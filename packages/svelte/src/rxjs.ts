/**
 * @file Svelte 适配层的 RxJS 桥接函数：把 @slux/rxjs 的 ObservableState 经 toReadable
 * 包装为 Svelte 的 Readable store。
 */

import type { Readable } from "svelte/store";
import type { ObservableState } from "@slux/rxjs";
import { toReadable } from "./signal.js";

/**
 * 把 ObservableState 转换为 Svelte 的 Readable store，值变化经 toReadable 触发订阅者更新。
 * @typeParam T ObservableState 承载的值类型
 * @param source ObservableState 实例，应传入稳定引用
 * @returns Readable<T>
 * @remarks 仅做类型化转发，订阅的建立与清理、SSR 边界均由 toReadable 承担
 * @see toReadable
 */
export function toObservableStore<T>(source: ObservableState<T>): Readable<T> {
  return toReadable(source);
}
