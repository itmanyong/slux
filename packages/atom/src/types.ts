/**
 * @file atom 包的公共类型定义：原子句柄、读取/写入函数与作用域接口的类型契约。
 */

import type { Subscribable } from "@slux/core";

/**
 * 读取原子的泛型函数类型：给定 Subscribable 句柄，返回其当前值。
 * @typeParam Value 原子持有的值类型，由传入的 atom 推断
 * @param atom 被读取的原子句柄，同时作为依赖解析的键
 * @see AtomSetter 配对的写入函数类型
 */
export type AtomGetter = <Value>(atom: Subscribable<Value>) => Value;
/**
 * 写入可写原子的泛型函数类型：把 value 写入给定 atom。
 * @typeParam Value 目标原子持有的值类型，须与 atom 一致
 * @param atom 目标可写原子句柄
 * @param value 待写入的替换值
 * @see AtomGetter 配对的读取函数类型
 */
export type AtomSetter = <Value>(atom: Atom<Value>, value: Value) => void;

/**
 * 可写原子句柄类型：在 Subscribable<T> 的读取能力之上，追加 set 与 update 两个写入方法。
 * @typeParam T 原子持有的值类型
 */
export type Atom<T> = Subscribable<T> & {
  /**
   * 直接写入替换值。
   * @param value 待写入的替换值
   */
  set(value: T): void;
  /**
   * 基于当前值变换后写回：以 fn(current) 的返回值作为新值。
   * @param fn 变换函数，接收当前值并返回新值
   * @see set 配对的直接写入方法
   */
  update(fn: (current: T) => T): void;
};

/**
 * 只读原子句柄类型：等价于 Subscribable<T>，只暴露读取与订阅能力。
 * @typeParam T 原子持有的值类型
 * @see Atom 配对的可写原子类型
 */
export type ReadonlyAtom<T> = Subscribable<T>;

/**
 * 自定义写入签名的原子类型：在 Subscribable<Value> 之上追加一个带自定义参数与返回值的 write 方法。
 * 与 Atom<T> 的区别在于写入不固定为单值替换，而是由 Args/Result 描述任意写入契约。
 * @typeParam Value 读取侧的值类型
 * @typeParam Args write 方法的参数元组类型
 * @typeParam Result write 方法的返回值类型
 */
export type WritableAtom<Value, Args extends unknown[], Result> = Subscribable<Value> & {
  /**
   * 以自定义参数执行写入。
   * @param args 写入参数，展开为 Args 元组对应的实参列表
   * @returns 写入结果，具体语义由该原子实现定义
   */
  write(...args: Args): Result;
};

/**
 * 任意可读原子的联合类型：统一可写、只读与自定义写入三类原子，供 get/sub 等只要求「可读」的入口使用。
 * @typeParam T 原子持有的值类型，默认 unknown 表示不预设具体值类型
 * @see Atom 可写分支
 * @see ReadonlyAtom 只读分支
 * @see WritableAtom 自定义写入分支
 */
export type AnyReadableAtom<T = unknown> = Atom<T> | ReadonlyAtom<T> | WritableAtom<T, unknown[], unknown>;

/**
 * 作用域接口：定义对原子进行读取、写入与订阅的一组操作。
 * 状态的存储位置与订阅调度由具体实现承担，本接口只约束方法签名。
 * @see AtomGetter 读取语义的函数类型
 * @see AtomSetter 写入语义的函数类型
 */
export type AtomScope = {
  /**
   * 读取原子在当前作用域中的值。
   * @typeParam T 原子持有的值类型
   * @param atom 待读取的可读原子句柄
   */
  get<T>(atom: AnyReadableAtom<T>): T;
  /**
   * 向可写原子写入替换值。
   * @typeParam T 原子持有的值类型
   * @param atom 目标可写原子句柄
   * @param value 待写入的替换值
   */
  set<T>(atom: Atom<T>, value: T): void;
  /**
   * 订阅原子值变化。
   * @typeParam T 原子持有的值类型
   * @param atom 被订阅的可读原子句柄
   * @param callback 值变化时被调用，接收新值
   * @returns 取消订阅函数，需显式调用以释放订阅
   */
  sub<T>(atom: AnyReadableAtom<T>, callback: (value: T) => void): () => void;
};
