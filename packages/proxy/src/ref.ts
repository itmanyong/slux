/**
 * @file ref 的创建与判定：以固定标记包装可变 current 值，并提供 isRef 判定。
 */
import { REF_MARKER } from "./types.js";
import type { Ref } from "./types.js";

/**
 * 创建一个持有可变值的引用，并打上 REF_MARKER 标记以供 isRef 识别。
 * @param value 初始值，存入 current。
 * @returns Ref<T> 引用对象。
 * @see isRef
 */
export function ref<T>(value: T): Ref<T> {
  return { current: value, [REF_MARKER]: true };
}

/**
 * 判定一个对象是否为 ref。
 * @param value 待判定的对象。
 * @returns true 表示 value 由 ref 创建。
 * @see ref
 */
export function isRef(value: object): boolean {
  return REF_MARKER in value;
}
