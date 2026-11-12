/**
 * @file Svelte 适配层的核心 signal 转换函数：把 @slux/core 的 Subscribable / Signal 包装为
 * Svelte 的 Readable / Writable store，供 atom / flux / rxjs / proxy / state-machine 等复用。
 */

import { readable } from "svelte/store";
import type { Readable, Writable } from "svelte/store";
import { effect } from "@slux/core";
import type { Signal, Subscribable } from "@slux/core";

/**
 * 把任意 Subscribable 包装为 Svelte 的 Readable store，供组件通过订阅读取值。
 * @typeParam T source 承载的值类型，也是 Readable 的值类型
 * @param source 可读且可订阅的数据源，构造时即被读取一次作为初始值
 * @returns Readable<T>
 * @remarks 采用 readable 的惰性订阅：start 仅在首个订阅者出现时执行，建立订阅与 core effect（保持派生值持续刷新），
 *          并补推一次当前值以免建立期间漏掉变更；最后一个订阅者离开时按「先退订、再停 effect」清理。
 *          SSR 阶段无订阅者时不建立订阅。
 * @see toWritable
 */
export function toReadable<T>(source: Subscribable<T>): Readable<T> {
  return readable(source.get(), (set) => {
    const unsubscribe = source.subscribe(set);
    // core 的 computed 按读取刷新，effect 须保持存活才能持续追踪派生值变化。
    const dispose = effect(() => {
      source.get();
    });

    // 补推订阅建立后的当前值，避免建立期间错过的变更丢失。
    set(source.get());

    return () => {
      unsubscribe();
      dispose();
    };
  });
}

/**
 * 把 Signal 包装为 Svelte 的 Writable store：订阅复用 toReadable，写入委托给 source.set。
 * @typeParam T Signal 承载的值类型，也是 Writable 的值类型
 * @param source 可读可写的 Signal，应传入稳定引用
 * @returns Writable<T>（含 subscribe / set / update）
 * @remarks source.set 接受取值函数，故写入时以 () => value 包装；set / update 为同步写入，不参与订阅生命周期
 * @see toReadable
 */
export function toWritable<T>(source: Signal<T>): Writable<T> {
  const set = (value: T) => source.set(() => value);

  return {
    subscribe: toReadable(source).subscribe,
    set,
    update: (fn) => set(fn(source.get())),
  };
}
