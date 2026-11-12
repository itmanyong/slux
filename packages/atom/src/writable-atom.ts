/**
 * @file atom 包的自定义写入原子工厂：创建带自定义 write(get, set, ...args) 签名的 WritableAtom 句柄并登记其配置。
 * write 内的写入经 batch 包裹，读写委托默认作用域。
 */

import { batch } from "@slux/core";
import { getDefaultScope } from "./atom-scope.js";
import { configs } from "./internals.js";
import type { AtomGetter, AtomSetter, WritableAtom } from "./types.js";

/**
 * 创建一个读取侧固定为 null 的自定义写入原子（只写场景）。
 * 把 read 参数收窄为 null，使返回类型的读取值类型精确为 null。
 * @typeParam Args write 方法的参数元组类型
 * @typeParam Result write 方法的返回值类型
 * @param read 固定为 null，表示不提供读取函数
 * @param write 自定义写入函数，接收 AtomGetter、AtomSetter 与展开的 args，返回 Result
 * @returns 读取侧类型为 null 的 WritableAtom 句柄
 */
export function writableAtom<Args extends unknown[], Result>(
  read: null,
  write: (get: AtomGetter, set: AtomSetter, ...args: Args) => Result,
): WritableAtom<null, Args, Result>;
/**
 * 创建一个带自定义读取函数的自定义写入原子。
 * 与 read 为 null 的重载并存，是为了在提供读取函数时把 Value 保留在返回类型中。
 * @typeParam Value 读取函数返回的值类型
 * @typeParam Args write 方法的参数元组类型
 * @typeParam Result write 方法的返回值类型
 * @param read 读取函数（接收 AtomGetter 并返回 Value）或 null；为 null 时读取值类型不如上一重载精确
 * @param write 自定义写入函数，接收 AtomGetter、AtomSetter 与展开的 args，返回 Result
 * @returns 读取侧类型为 Value 的 WritableAtom 句柄
 */
export function writableAtom<Value, Args extends unknown[], Result>(
  read: ((get: AtomGetter) => Value) | null,
  write: (get: AtomGetter, set: AtomSetter, ...args: Args) => Result,
): WritableAtom<Value, Args, Result>;
/**
 * 上述重载的实现：构造 WritableAtom 句柄，并按 read 是否为 null 登记为 base 或 derived 配置。
 * write 在调用时用 batch 包裹，并把绑定同一作用域的 get/set 适配器传入用户 write，使读写落在同一作用域内。
 * @typeParam Value 读取侧的值类型
 * @typeParam Args write 方法的参数元组类型
 * @typeParam Result write 方法的返回值类型
 * @param read 读取函数或 null；为 null 时登记为 base 配置且初始值为 null，否则登记为 derived 配置
 * @param write 用户提供的写入函数，仅在句柄的 write 方法被调用时执行
 * @returns 新建的 WritableAtom<Value | null, Args, Result> 句柄
 * @remarks 副作用：向内部 configs 表登记一条配置，登记在句柄构造完成之后进行
 */
export function writableAtom<Value, Args extends unknown[], Result>(
  read: ((get: AtomGetter) => Value) | null,
  write: (get: AtomGetter, set: AtomSetter, ...args: Args) => Result,
): WritableAtom<Value | null, Args, Result> {
  // 方法体内的 value 是句柄自身，只在句柄构造完成后才会被实际调用。
  const value: WritableAtom<Value | null, Args, Result> = {
    /**
     * 读取当前值。
     * @returns 当前值
     */
    get: () => getDefaultScope().get(value),
    /**
     * 订阅值变更。
     * @param callback 变更时被调用的回调
     * @returns 取消订阅函数
     */
    subscribe: (callback) => getDefaultScope().sub(value, callback),
    /**
     * 执行自定义写入：把用户 write 的执行置于 batch 中并返回其结果。
     * @param args 写入实参，原样转发给用户 write
     * @returns 用户 write 的返回值，经 batch 原样透传
     */
    write: (...args) => {
      // get/set 适配器绑定同一 scope，保证 write 内的读写落在同一作用域。
      const scope = getDefaultScope();
      return batch(() =>
        write(
          (atom) => scope.get(atom),
          (atom, next) => scope.set(atom, next),
          ...args,
        ),
      );
    },
  };
  configs.set(value, read === null ? { kind: "base", initialValue: null } : { kind: "derived", read });
  return value;
}
