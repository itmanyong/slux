import { computed, effect, signal } from "@slux/core";
import type { Signal, Subscribable } from "@slux/core";
import { configs } from "./internals.js";
import type { AnyReadableAtom, Atom, AtomGetter, AtomScope } from "./types.js";

class AtomScopeImpl implements AtomScope {
  readonly #values = new WeakMap<object, Subscribable<unknown>>();

  readonly get: AtomGetter = <T>(atom: Subscribable<T>): T => this.#resolve(atom).get();

  #resolve<T>(atom: Subscribable<T>): Subscribable<T> {
    const cached = this.#values.get(atom);
    if (cached) return cached as Subscribable<T>;
    const config = configs.get(atom);
    if (!config) return atom;
    const value = config.kind === "base" ? signal(config.initialValue) : computed(() => config.read(this.get));
    this.#values.set(atom, value);
    // 注册配置与实例类型一一对应，WeakMap 仅在存储时擦除值类型。
    return value as Subscribable<T>;
  }

  set<T>(atom: Atom<T>, value: T): void {
    const target = this.#resolve(atom) as Signal<T>;
    // core 把函数参数视为 recipe，atom 的 set 始终接收替换值。
    if (typeof value === "function") target.set(() => value);
    else target.set(value);
  }

  sub<T>(atom: AnyReadableAtom<T>, callback: (value: T) => void): () => void {
    const source = this.#resolve(atom);
    let previous: T;
    let initialized = false;
    // effect 只负责主动求值；通知经 core.subscribe 送出，回调读取不会污染依赖。
    const stopEffect = effect(() => {
      const value = source.get();
      if (!initialized) {
        initialized = true;
        previous = value;
      }
    });
    const stopSubscription = source.subscribe((value) => {
      if (Object.is(previous, value)) return;
      previous = value;
      callback(value);
    });
    return () => {
      stopSubscription();
      stopEffect();
    };
  }
}

let defaultScope: AtomScope | undefined;

export function getDefaultScope(): AtomScope {
  return (defaultScope ??= createAtomScope());
}

export function createAtomScope(): AtomScope {
  return new AtomScopeImpl();
}
