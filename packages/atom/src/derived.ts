/**
 * @file atom 包的派生（只读）原子工厂：构造 ReadonlyAtom<T> 句柄并登记其读取函数。
 * 依赖收集、缓存失效与重算调度由作用域层依据登记的 read 完成。
 */

import { getDefaultScope } from "./atom-scope.js";
import { configs } from "./internals.js";
import type { AtomGetter, ReadonlyAtom } from "./types.js";

/**
 * 创建一个只读派生原子，返回带 get/subscribe 的 ReadonlyAtom<T> 句柄。
 * 与基础原子一样采用「薄句柄 + 外部状态」：句柄不保存值，读取与订阅委托默认作用域。
 * @typeParam T 派生值的类型
 * @param read 计算函数，接收 AtomGetter 并返回派生值；仅登记，不在本函数内调用
 * @returns 新建的 ReadonlyAtom<T> 句柄
 * @remarks 副作用：向内部 configs 表登记 { kind: "derived", read }；登记在句柄构造完成之后进行，
 *          以确保各方法闭包引用的 value 已完整定义
 * @see atom 配对的基础原子工厂，产出可写句柄
 */
export function derived<T>(read: (get: AtomGetter) => T): ReadonlyAtom<T> {
  // 方法体内的 value 是句柄自身，只在句柄构造完成后才会被实际调用。
  const value: ReadonlyAtom<T> = {
    /**
     * 读取派生值。
     * @returns 当前派生值
     */
    get: () => getDefaultScope().get(value),
    /**
     * 订阅派生值变更。
     * @param callback 变更时被调用的回调
     * @returns 取消订阅函数
     */
    subscribe: (callback) => getDefaultScope().sub(value, callback),
  };
  configs.set(value, { kind: "derived", read });
  return value;
}
