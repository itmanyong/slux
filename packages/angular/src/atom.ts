/**
 * @file 把 @slux/atom 的原子注入为 Angular 风格的 Signal 与写入函数。
 */

import type { Signal } from "@angular/core";
import type { Atom, AnyReadableAtom } from "@slux/atom";
import { toAngularSignal } from "./bridge.js";
import type { ToAngularSignalOptions } from "./bridge.js";

/**
 * 把只读原子转换为 Angular 的 Signal<T>。
 * @typeParam T 原子持有的值类型，也是返回 Signal 的值类型
 * @param source 待转换的可读原子
 * @param options 可选的转换配置；为 undefined 时采用默认行为
 * @returns 只读 Signal<T>，订阅的建立与清理由 toAngularSignal 管理
 * @see toAngularSignal 实际执行转换与订阅清理的实现
 * @see injectAtom 同时返回信号与写入函数的组合入口
 */
export function injectAtomValue<T>(source: AnyReadableAtom<T>, options?: ToAngularSignalOptions<T>): Signal<T> {
  return toAngularSignal(source, options);
}
/**
 * 为可写原子生成一个写入函数，调用时把 value 写入源原子。
 * @typeParam T 原子持有的值类型
 * @param source 目标可写原子
 * @returns 形如 (value: T) => void 的写入函数；写入时机由调用方决定
 * @see injectAtomValue 配对的读取信号入口
 * @see injectAtom 同时返回两者的组合入口
 */
export function injectSetAtom<T>(source: Atom<T>): (value: T) => void {
  return (value: T) => source.set(value);
}
/**
 * 一次性取得原子的读取信号与写入函数，以 [Signal<T>, setter] 元组返回。
 * @typeParam T 原子持有的值类型
 * @param source 目标可写原子，同时用于生成读取信号与写入函数
 * @param options 可选的转换配置，转发给 injectAtomValue
 * @returns 第 0 项为只读 Signal<T>，第 1 项为写入函数；二者作用于同一 source
 * @see injectAtomValue
 * @see injectSetAtom
 */
export function injectAtom<T>(source: Atom<T>, options?: ToAngularSignalOptions<T>): [Signal<T>, (value: T) => void] {
  return [injectAtomValue(source, options), injectSetAtom(source)];
}
