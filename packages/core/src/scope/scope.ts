import type { Scope, Signal, Subscribable } from "../types/index.js";

let currentScope: Scope | undefined;
let keyCounter = 0;
const keys = new WeakMap<Subscribable<unknown>, string>();

class ScopeImpl implements Scope {
  readonly #values = new Map<Subscribable<unknown>, unknown>();
  readonly #parent: Scope | undefined;

  constructor(parent?: Scope) {
    this.#parent = parent;
  }

  fork(): Scope {
    return new ScopeImpl(this);
  }

  get<T>(source: Subscribable<T>): T {
    if (this.#values.has(source)) return this.#values.get(source) as T;
    return this.#parent ? this.#parent.get(source) : source.get();
  }

  set<T>(source: Signal<T>, value: T): void {
    this.#values.set(source, value);
  }

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

export function createScope(): Scope {
  return new ScopeImpl();
}

/** 只在同步回调期间设置上下文，跨 await 的隔离由服务端适配层负责。 */
export function runInScope<T>(scope: Scope, fn: () => T): T {
  const previous = currentScope;
  currentScope = scope;
  try {
    return fn();
  } finally {
    currentScope = previous;
  }
}

export function serializeScope(scope: Scope): Record<string, unknown> {
  return scope.serialize();
}

/** 供仓库内适配层读取同步上下文。 */
export function getCurrentScope(): Scope | undefined {
  return currentScope;
}
