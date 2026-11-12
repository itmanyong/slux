/**
 * @file proxy 包的公共类型与标记：ref 的唯一标记、Ref 形状与只读递归快照类型 Snapshot。
 */

/**
 * 标记 ref 对象的唯一 symbol 键；以 unique symbol 声明，使其在类型层面可作为 Ref 的计算属性键。
 */
export const REF_MARKER: unique symbol = Symbol("slux.ref");

/**
 * ref 对象的形状：可变的 current 值加只读的唯一标记。
 * @typeParam T current 持有值的类型。
 */
export type Ref<T> = {
  /** 当前持有的值。 */
  current: T;
  /** 只读的 ref 标记，固定为字面量 true。 */
  readonly [REF_MARKER]: true;
};

/**
 * 把类型 T 映射为其只读深快照类型：函数保持原样，对象递归把每个属性变为只读，其余原样返回。
 * @typeParam T 待映射的原始类型。
 */
export type Snapshot<T> = T extends (...args: never[]) => unknown ? T : T extends object ? { readonly [K in keyof T]: Snapshot<T[K]> } : T;
