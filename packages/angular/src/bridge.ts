import { DestroyRef, InjectionToken, inject, makeEnvironmentProviders, signal } from "@angular/core";
import type { EnvironmentProviders, Injector, Signal } from "@angular/core";
import { Observable } from "rxjs";
import type { Subscription } from "rxjs";
import { effect } from "@slux/core";
import type { Scope, Subscribable } from "@slux/core";

export type ToAngularSignalOptions<T> = {
  readonly equal?: (previous: T, next: T) => boolean;
  readonly injector?: Injector;
};
export const SLUX_SCOPE = new InjectionToken<Scope>("SLUX_SCOPE");
export function provideSluxScope(scope: Scope): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: SLUX_SCOPE, useValue: scope }]);
}
export function injectScope(): Scope | undefined {
  return inject(SLUX_SCOPE, { optional: true }) ?? undefined;
}
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
      source.get();
    });
    const latest = source.get();
    if (!Object.is(current, latest)) subscriber.next(latest);
    return () => {
      unsubscribe();
      dispose();
    };
  });
}
export function toAngularSignal<T>(source: Subscribable<T>, options?: ToAngularSignalOptions<T>): Signal<T> {
  const destroyRef = options?.injector ? options.injector.get(DestroyRef) : inject(DestroyRef);
  const result = signal(source.get(), options?.equal ? { equal: options.equal } : undefined);
  const subscription = toObservable(source).subscribe((value) => result.set(value));
  destroyRef.onDestroy(() => subscription.unsubscribe());
  return result.asReadonly();
}
export function fromObservable<T>(source: Observable<T>, initialValue: T): Subscribable<T> {
  let current = initialValue;
  let subscription: Subscription | undefined;
  const listeners = new Set<(value: T) => void>();
  return {
    get: () => current,
    subscribe(callback) {
      // core 的 subscribe 只推送后续变化，同步首值通过 get 读取。
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
          // 与参考桥接一致，错误保留最后值；业务应在上游 catchError。
          error() {},
        });
      }
      connecting = false;
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          subscription?.unsubscribe();
          subscription = undefined;
        }
      };
    },
  };
}
