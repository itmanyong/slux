/**
 * @file atom 包的作用域实现：把原子句柄解析为 @slux/core 的 signal/computed 实例，
 * 提供 get/set/sub 语义，并管理默认作用域单例。每个作用域以 WeakMap 缓存「句柄 -> 实例」，不同作用域间状态隔离。
 */

import { computed, effect, signal } from "@slux/core";
import type { Signal, Subscribable } from "@slux/core";
import { configs } from "./internals.js";
import type { AnyReadableAtom, Atom, AtomGetter, AtomScope } from "./types.js";

/**
 * AtomScope 的默认实现：以 WeakMap 把原子句柄映射到本作用域内的 Subscribable 实例。
 * @remarks 用 WeakMap 而非强引用 Map，使句柄被回收时其作用域内实例可一并释放；
 *          sub 的清理按注册相反顺序执行：先停订阅、再停 effect。
 */
class AtomScopeImpl implements AtomScope {
  /** 本作用域内的句柄缓存：键为原子句柄对象，值为解析出的 Subscribable 实例。 */
  readonly #values = new WeakMap<object, Subscribable<unknown>>();

  /**
   * 按 AtomGetter 语义读取原子当前值：先把句柄解析为本作用域实例，再取其 get() 结果。
   * @typeParam T 原子持有的值类型
   * @param atom 待读取的原子句柄，同时作为 #resolve 的缓存键
   */
  readonly get: AtomGetter = <T>(atom: Subscribable<T>): T => this.#resolve(atom).get();

  /**
   * 把原子句柄解析为本作用域内对应的 Subscribable 实例：命中缓存则复用，否则按 configs 登记创建。
   * @typeParam T 原子持有的值类型
   * @param atom 待解析的原子句柄，用作 #values 与 configs 的查询键
   * @returns 本作用域内的 Subscribable<T> 实例；若 configs 中无登记，则原样返回入参 atom（视为已有的 Subscribable）
   * @remarks 缓存保证同一句柄在同一作用域内始终对应同一实例，避免状态分裂；
   *          派生分支以 this.get 作为 AtomGetter，使派生依赖落在同一作用域内
   */
  #resolve<T>(atom: Subscribable<T>): Subscribable<T> {
    const cached = this.#values.get(atom);
    if (cached) return cached as Subscribable<T>; // 缓存值类型为 unknown，取回需断言回 T
    const config = configs.get(atom);
    if (!config) return atom; // 未登记的句柄按「已是 Subscribable」回退，直接透传
    // "base" 用 signal 存初始值，"derived" 用 computed 包裹 read；
    // derived 传入 this.get 使派生读取经由同一作用域，依赖不跨作用域。
    const value = config.kind === "base" ? signal(config.initialValue) : computed(() => config.read(this.get));
    this.#values.set(atom, value);
    return value as Subscribable<T>;
  }

  /**
   * 向可写原子写入替换值：把句柄解析为本作用域的 Signal 后调用其 set。
   * @typeParam T 原子持有的值类型
   * @param atom 目标可写原子句柄
   * @param value 替换值；若为函数，需包一层常量函数再写入（见实现处说明）
   */
  set<T>(atom: Atom<T>, value: T): void {
    // set 只接收 Atom<T>（可写原子），其解析结果必为 Signal。
    const target = this.#resolve(atom) as Signal<T>;
    // core 把传给 set 的函数参数视为 recipe 执行，而 atom 的 set 语义始终接收替换值本身，
    // 故函数值需包一层 () => value 使其作为常量返回。
    if (typeof value === "function") target.set(() => value);
    else target.set(value);
  }

  /**
   * 订阅原子值变化：仅在值相对上一次通知发生变化时调用 callback，并返回取消订阅的清理函数。
   * 设计为「effect 主动求值 + subscribe 送出通知」两条通路，使订阅回调中的读取不改变依赖追踪结果。
   * @typeParam T 原子持有的值类型
   * @param atom 被订阅的只读原子句柄，作为 #resolve 的键
   * @param callback 值变化时被调用，接收新值
   * @returns 取消函数：调用后同时停止订阅与 effect
   */
  sub<T>(atom: AnyReadableAtom<T>, callback: (value: T) => void): () => void {
    const source = this.#resolve(atom);
    let previous: T;
    let initialized = false;
    // effect 只负责求值与建立依赖；首次执行把当前值记为基准，不触发通知。
    const stopEffect = effect(() => {
      const value = source.get();
      if (!initialized) {
        initialized = true;
        previous = value;
      }
    });
    const stopSubscription = source.subscribe((value) => {
      if (Object.is(previous, value)) return; // 抑制重复通知
      previous = value;
      callback(value);
    });
    // 清理按注册相反顺序：先停订阅避免再收到通知，再停 effect 释放依赖。
    return () => {
      stopSubscription();
      stopEffect();
    };
  }
}

/** 模块级默认作用域单例；undefined 表示尚未初始化，由 getDefaultScope 首次调用时懒创建。 */
let defaultScope: AtomScope | undefined;

/**
 * 返回模块级默认作用域；首次调用时懒创建并缓存，后续调用复用同一实例。
 * @returns 唯一的默认 AtomScope 实例
 * @see createAtomScope 配对工厂，用于创建相互隔离的独立作用域
 */
export function getDefaultScope(): AtomScope {
  return (defaultScope ??= createAtomScope());
}

/**
 * 创建一个相互隔离的独立作用域实例，其内部缓存与其他作用域互不相通。
 * @returns 新建的 AtomScope（内部为 AtomScopeImpl）
 * @see getDefaultScope 配对入口，返回复用的单例默认作用域
 */
export function createAtomScope(): AtomScope {
  return new AtomScopeImpl();
}
