/**
 * @file 把 @slux/store 的 StoreApi 桥接为 actview 侧的只读 Ref，支持 selector 派生与自定义相等比较；订阅绑定与生命周期由 bindExternal 承担。
 */
import type { StoreApi } from "@slux/store";
import type { Ref } from "@actview/core";
import { bindExternal } from "./binding.js";
/**
 * 读取整个 store 状态，返回其只读 Ref（不带 selector 的重载）。
 * @typeParam T store 的状态类型
 * @param store StoreApi 实例
 * @returns 只读 Ref<T>，其值随 store 状态更新
 * @see useStore 带 selector 的重载
 */
export function useStore<T>(store: StoreApi<T>): Readonly<Ref<T>>;
/**
 * 以 selector 从 store 状态派生值，返回该派生值的只读 Ref；仅在派生值按 equals 判定为变化时刷新。
 * 把裁剪/派生下推到读取回调，使组件只订阅自己关心的切片，避免整状态变化都触发刷新。
 * @typeParam T store 的完整状态类型
 * @typeParam S selector 派生出的值类型
 * @param store StoreApi 实例
 * @param selector 从完整状态计算派生值的纯函数，每次取值时被调用
 * @param equals 比较前后两个派生值的函数，返回 true 表示相等、跳过刷新；默认 Object.is
 * @returns 只读 Ref<S>，其值随派生结果更新
 * @see useStore 不带 selector 的重载；bindExternal 订阅与刷新链路的实现
 */
export function useStore<T, S>(store: StoreApi<T>, selector: (state: T) => S, equals?: (a: S, b: S) => boolean): Readonly<Ref<S>>;
/**
 * 两个重载的统一实现：读取、订阅与相等比较三个回调交由 bindExternal 统一调度。
 * @typeParam T store 的完整状态类型
 * @typeParam S 派生值类型，省略 selector 时默认等于 T
 * @param store StoreApi 实例
 * @param selector 派生函数，默认恒等映射
 * @param equals 派生值比较函数，默认 Object.is，返回 true 时绑定层跳过刷新
 * @returns 只读 Ref<S>，随作用域释放失效，不接管 store 生命周期
 * @remarks 默认 selector 借助 unknown 双重断言：省略 selector 时 S 默认取 T，但泛型实现里无法证明 T 可赋给 S。
 * @see bindExternal 外部源的绑定与生命周期实现
 */
export function useStore<T, S = T>(
  store: StoreApi<T>,
  selector: (state: T) => S = (state) => state as unknown as S,
  equals: (a: S, b: S) => boolean = Object.is,
): Readonly<Ref<S>> {
  return bindExternal(
    () => selector(store.getState()),
    (notify) => store.subscribe(notify),
    equals,
  );
}
