/**
 * @file Svelte 适配层的 proxy 快照转换函数：把 @slux/proxy 的 snapshot / subscribe 适配为
 * 含 get / subscribe 的对象后经 toReadable 包装为 Svelte 的 Readable<Snapshot<T>>。
 */

import type { Readable } from "svelte/store";
import { snapshot, subscribe } from "@slux/proxy";
import type { Snapshot } from "@slux/proxy";
import { toReadable } from "./signal.js";

/**
 * 把代理对象包装为 Svelte 的 Readable store，订阅后取得当前快照。
 * @typeParam T 被代理的对象类型，约束为 object
 * @param proxy 由 @slux/proxy 创建的代理对象，应传入稳定引用
 * @returns Readable<Snapshot<T>>
 * @remarks proxy 只暴露 snapshot / subscribe 两个自由函数，这里就地构造含 get / subscribe 的对象交给 toReadable；
 *          订阅的建立与清理、SSR 边界均由 toReadable 承担
 * @see toReadable
 */
export function toSnapshot<T extends object>(proxy: T): Readable<Snapshot<T>> {
  return toReadable({
    get: () => snapshot(proxy),
    subscribe: (callback) => subscribe(proxy, () => callback(snapshot(proxy))),
  });
}
