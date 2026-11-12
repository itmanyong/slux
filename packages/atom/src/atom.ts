/**
 * @file atom 包的基础原子工厂：构造 Atom<T> 句柄，并把初始配置登记到内部 configs 表。
 * 值的存储、订阅调度与变更通知由作用域层承担。
 */

import { getDefaultScope } from "./atom-scope.js";
import { configs } from "./internals.js";
import type { Atom } from "./types.js";

/**
 * 创建一个基础原子，返回带 get/set/update/subscribe 的 Atom<T> 句柄。
 * 句柄自身不保存可变值，读写与订阅都在调用时委托给当时的默认作用域，使状态集中存储于作用域层。
 * @typeParam T 原子持有的值类型
 * @param initialValue 初始值，仅写入 configs 元数据供作用域使用
 * @returns 新建的 Atom<T> 句柄
 * @remarks 副作用：向内部 configs 表登记一条配置；登记发生在句柄构造完成之后，
 *          以确保各方法闭包引用的 value 已完整定义
 */
export function atom<T>(initialValue: T): Atom<T> {
  // 方法体内的 value 是句柄自身，只在句柄构造完成后才会被实际调用。
  const value: Atom<T> = {
    /**
     * 读取当前值。
     * @returns 当前值
     */
    get: () => getDefaultScope().get(value),
    /**
     * 写入新值。
     * @param next 待写入的新值
     */
    set: (next) => getDefaultScope().set(value, next),
    /**
     * 以当前值为输入做变换后写回。
     * @param fn 变换函数，接收当前值并返回新值
     */
    update: (fn) => value.set(fn(value.get())),
    /**
     * 订阅变更。
     * @param callback 变更时被调用的回调
     * @returns 取消订阅函数
     */
    subscribe: (callback) => getDefaultScope().sub(value, callback),
  };
  // kind: "base" 标记该条目为基础原子，供作用域按类别创建对应实例。
  configs.set(value, { kind: "base", initialValue });
  return value;
}
