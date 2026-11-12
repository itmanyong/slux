/**
 * @file angular 适配层的桥接核心：提供 Scope 的注入令牌，并实现 Subscribable 与 Angular Signal、RxJS Observable 的双向转换。
 * toAngularSignal 应在框架约定的注入上下文调用，其订阅经 DestroyRef.onDestroy 清理。
 */

import { DestroyRef, InjectionToken, inject, makeEnvironmentProviders, signal } from "@angular/core";
import type { EnvironmentProviders, Injector, Signal } from "@angular/core";
import { Observable } from "rxjs";
import type { Subscription } from "rxjs";
import { effect } from "@slux/core";
import type { Scope, Subscribable } from "@slux/core";

/**
 * toAngularSignal 的可选配置，描述如何把 Subscribable 转换为 Angular Signal。
 * @typeParam T 被转换信号的值类型
 */
export type ToAngularSignalOptions<T> = {
  /** 自定义相等比较函数：返回 true 表示视为相等；为 undefined 时使用 signal 的默认比较。 */
  readonly equal?: (previous: T, next: T) => boolean;
  /** 可选的注入器：提供时从中取得 DestroyRef；为 undefined 时使用调用时的注入上下文。 */
  readonly injector?: Injector;
};
/**
 * 在 Angular 注入体系中提供/获取 @slux/core 的 Scope 所用的注入令牌。
 * 以令牌而非直接使用全局单例，使不同注入器可各自提供独立的 Scope。
 * @see provideSluxScope 配对的注册入口
 * @see injectScope 配对的读取入口
 */
export const SLUX_SCOPE = new InjectionToken<Scope>("SLUX_SCOPE");
/**
 * 把给定 Scope 以 SLUX_SCOPE 令牌注册为环境提供者，使其在注入体系中可被 injectScope 取得。
 * @param scope 要提供的 Scope 实例
 * @returns 包含该令牌提供者的 EnvironmentProviders，需在应用或路由配置中注册
 * @see injectScope 配对的读取入口
 */
export function provideSluxScope(scope: Scope): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: SLUX_SCOPE, useValue: scope }]);
}
/**
 * 从当前注入上下文读取 SLUX_SCOPE 提供的 Scope，未提供时返回 undefined。
 * @returns 注入到的 Scope；无提供者时为 undefined
 * @see provideSluxScope 配对的注册入口
 */
export function injectScope(): Scope | undefined {
  return inject(SLUX_SCOPE, { optional: true }) ?? undefined;
}
/**
 * 把 @slux/core 的 Subscribable 适配为 RxJS Observable：订阅时立即推送当前值，随后推送每次变化。
 * @typeParam T 源与 Observable 发射的值类型
 * @param source 被适配的 Subscribable
 * @returns 新建的 Observable<T>；每次订阅独立持有自己的 source 订阅与 effect，退订时一并清理
 * @remarks 额外用 effect 主动求值以触发依赖追踪；订阅与 effect 的建立窗口内发生的变更
 *          会在建立完成后通过重读补发，避免丢失这段窗口内的更新。
 * @see toAngularSignal 基于本函数取得订阅的转换入口
 */
export function toObservable<T>(source: Subscribable<T>): Observable<T> {
  return new Observable<T>((subscriber) => {
    let current = source.get();
    subscriber.next(current);
    if (subscriber.closed) return;
    const unsubscribe = source.subscribe((value) => {
      current = value;
      subscriber.next(value);
    });
    const dispose = effect(() => {
      source.get(); // effect 内主动读取以触发依赖追踪
    });
    const latest = source.get();
    if (!Object.is(current, latest)) subscriber.next(latest); // 补发订阅建立窗口内错过的变更
    return () => {
      unsubscribe();
      dispose();
    };
  });
}
/**
 * 把 Subscribable 适配为只读的 Angular Signal，并随注入上下文的销毁自动取消订阅。
 * @typeParam T 源与 Signal 的值类型
 * @param source 被适配的 Subscribable
 * @param options equal 用于自定义相等比较，injector 用于指定取 DestroyRef 的注入器
 * @returns 只读 Signal<T>；订阅由 onDestroy 回调自动清理，调用方无需手动退订
 * @remarks 未提供 injector 时通过 inject(DestroyRef) 获取清理挂载点，要求处于注入上下文。
 * @see toObservable 提供底层订阅的适配器
 * @see fromObservable 反向的 Observable -> Subscribable 转换
 */
export function toAngularSignal<T>(source: Subscribable<T>, options?: ToAngularSignalOptions<T>): Signal<T> {
  const destroyRef = options?.injector ? options.injector.get(DestroyRef) : inject(DestroyRef);
  const result = signal(source.get(), options?.equal ? { equal: options.equal } : undefined);
  const subscription = toObservable(source).subscribe((value) => result.set(value));
  destroyRef.onDestroy(() => subscription.unsubscribe());
  return result.asReadonly();
}
/**
 * 把 RxJS Observable 适配为 @slux/core 的 Subscribable：以 initialValue 为首值，并在有订阅者时连接上游。
 * @typeParam T 发射与读取的值类型
 * @param source 被适配的 Observable
 * @param initialValue 订阅建立前 get 返回的初始值
 * @returns 一个 Subscribable<T>；get 返回最近一次的值，subscribe 返回取消订阅函数
 * @remarks 采用「首个订阅者建立上游订阅、最后一个订阅者退订时断开」的策略，避免无订阅者时空转上游；
 *          connecting 标志抑制连接期间同步到达的首值，使 Subscribable 的同步首值统一由 get 读取。
 * @see toAngularSignal 相关的 Signal 转换入口
 */
export function fromObservable<T>(source: Observable<T>, initialValue: T): Subscribable<T> {
  let current = initialValue;
  let subscription: Subscription | undefined;
  const listeners = new Set<(value: T) => void>();
  return {
    /** 读取当前值：返回最近一次上游发射的值，或订阅建立前的 initialValue。 */
    get: () => current,
    /**
     * 登记一个订阅者，并在首个订阅者出现时连接上游；返回取消订阅函数。
     * @param callback 值变化时被调用；连接期间同步到达的首值不转发给它
     * @returns 取消订阅函数：移除本 listener，最后一个订阅者退订时断开上游订阅
     */
    subscribe(callback) {
      // core 的 subscribe 只推送后续变化，同步首值通过 get 读取，故用 connecting 抑制连接期首值。
      let connecting = true;
      const listener = (value: T) => {
        if (!connecting) callback(value);
      };
      listeners.add(listener);
      if (!subscription) {
        subscription = source.subscribe({
          next(value) {
            current = value;
            for (const notify of listeners) notify(value);
          },
          // 上游错误不更新 current、不通知订阅者，保留最后一次值。
          error() {},
        });
      }
      connecting = false;
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          subscription?.unsubscribe();
          subscription = undefined; // 清空句柄，使下次订阅能重新连接上游
        }
      };
    },
  };
}
