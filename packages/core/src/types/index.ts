export type Subscribable<T> = {
  get(): T;
  /** 订阅后续变化，不立即调用回调。 */
  subscribe(callback: (value: T) => void): () => void;
};

export type ReadonlySignal<T> = Subscribable<T>;

export type Signal<T> = ReadonlySignal<T> & {
  /** 修改草稿，或返回替换值；无返回值时提交草稿修改。 */
  set(recipe: (draft: T) => T | void): void;
  /** 替换整个值；函数值需使用 set(() => fn)。 */
  set(value: T): void;
};

export type SignalOptions<T> = {
  readonly equals?: (a: T, b: T) => boolean;
};

export type Scope = {
  fork(): Scope;
  get<T>(subscribable: Subscribable<T>): T;
  set<T>(signal: Signal<T>, value: T): void;
  /** 只序列化本作用域显式赋值的条目，不含继承值。 */
  serialize(): Record<string, unknown>;
};
