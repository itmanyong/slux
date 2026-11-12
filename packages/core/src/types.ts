/** @file core 包公共类型契约。 */
/**
 * 可订阅对象的最小契约：读取当前值并订阅后续变化。
 * signal、computed 等均实现该形状。
 */
export type Subscribable<T> = {
  /** 读取当前值，不产生订阅副作用。 */
  get(): T;
  /**
   * 订阅后续变化（不立即触发回调）。
   * @param callback 值变化时的回调，入参为变化后的值。
   * @returns 取消订阅句柄。
   */
  subscribe(callback: (value: T) => void): () => void;
};

/** 只读信号：仅暴露读取与订阅，在类型层面禁止写入（如 computed 的产出）。 */
export type ReadonlySignal<T> = Subscribable<T>;

/** 可写信号：在只读信号基础上追加 set 写入能力。 */
export type Signal<T> = ReadonlySignal<T> & {
  /**
   * 写入信号：传入新值直接替换，或传入 recipe 以当前值为草稿做不可变修改。
   * 新值本身为函数时必须用 recipe 形式：set(() => fn)。
   */
  set(recipe: (draft: T) => T | void): void;
  set(value: T): void;
};

/** 信号可选配置。 */
export type SignalOptions<T> = {
  /**
   * 自定义新旧值相等比较；返回 true 视为未变化、不通知下游。
   * 省略时默认 Object.is。
   */
  readonly equals?: (a: T, b: T) => boolean;
};

/** 作用域：在继承链上隔离信号的本地赋值，支持 fork 派生与序列化。 */
export type Scope = {
  /** 派生一个继承当前取值的子作用域。 */
  fork(): Scope;
  /**
   * 读取可订阅对象在本作用域下的值：优先本作用域显式赋值，否则沿父链回退。
   */
  get<T>(subscribable: Subscribable<T>): T;
  /** 在本作用域为信号设置本地值（覆盖父链取值）。 */
  set<T>(signal: Signal<T>, value: T): void;
  /** 仅序列化本作用域显式赋值的条目（不含继承值）。 */
  serialize(): Record<string, unknown>;
};
