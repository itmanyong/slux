/** @file 作用域：信号本地赋值的继承链隔离与序列化。 */
import type { Scope, Signal, Subscribable } from "./types.js";

// 当前同步上下文中的作用域，仅 runInScope 回调期间有效。
let currentScope: Scope | undefined;
// 序列化键自增序号。
let keyCounter = 0;
// 「可订阅对象 -> 序列化键」缓存，使同一对象跨调用复用同一键。
const keys = new WeakMap<Subscribable<unknown>, string>();

/**
 * 作用域实现：保存本作用域的显式赋值，取值沿父链回退，最终回退到信号自身的 get。
 * 用父指针而非复制父值，子作用域天然继承父值且写入互不干扰。
 */
class ScopeImpl implements Scope {
  readonly #values = new Map<Subscribable<unknown>, unknown>();
  readonly #parent: Scope | undefined;

  constructor(parent?: Scope) {
    this.#parent = parent;
  }

  /** 派生一个以当前作用域为父的子作用域。 */
  fork(): Scope {
    return new ScopeImpl(this);
  }

  /** 取值回退顺序：本作用域显式赋值 -> 父作用域（递归）-> 信号自身的 get。 */
  get<T>(source: Subscribable<T>): T {
    if (this.#values.has(source)) return this.#values.get(source) as T;
    return this.#parent ? this.#parent.get(source) : source.get();
  }

  /** 在本作用域为信号设置本地值，覆盖父链取值。 */
  set<T>(source: Signal<T>, value: T): void {
    this.#values.set(source, value);
  }

  /**
   * 序列化本作用域显式赋值的条目（不含继承值）。
   * 键名按可订阅对象首次遇到的序号生成并缓存，跨调用保持稳定。
   */
  serialize(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [source, value] of this.#values) {
      let key = keys.get(source);
      if (key === undefined) {
        key = `__scope_${keyCounter++}`;
        keys.set(source, key);
      }
      result[key] = value;
    }
    return result;
  }
}

/** 创建一个根作用域。 */
export function createScope(): Scope {
  return new ScopeImpl();
}

/**
 * 在同步回调期间将 scope 设为当前作用域，回调结束（含抛错）后复原。
 * 仅覆盖同步调用栈；跨 await 的上下文隔离由服务端适配层负责。
 */
export function runInScope<T>(scope: Scope, fn: () => T): T {
  const previous = currentScope;
  currentScope = scope;
  try {
    return fn();
  } finally {
    currentScope = previous;
  }
}

/** 序列化指定作用域的显式赋值。 */
export function serializeScope(scope: Scope): Record<string, unknown> {
  return scope.serialize();
}

/** 读取当前作用域，供仓库内适配层使用；无活动 runInScope 回调时为 undefined。 */
export function getCurrentScope(): Scope | undefined {
  return currentScope;
}
