import { batch, effect, signal } from "@slux/core";
import type { ReadonlySignal, Subscribable } from "@slux/core";
import { Observable } from "rxjs";

export type ObservableStatus = "active" | "complete" | "error" | "disposed";
export type ObservableState<T> = Subscribable<T> & {
  readonly status: ReadonlySignal<ObservableStatus>;
  readonly error: ReadonlySignal<unknown>;
  dispose(): void;
};

export function toObservable<T>(source: Subscribable<T>): Observable<T> {
  return new Observable<T>((subscriber) => {
    let current = source.get();
    subscriber.next(current);
    if (subscriber.closed) return;

    subscriber.add(
      source.subscribe((value) => {
        current = value;
        subscriber.next(value);
      }),
    );
    if (subscriber.closed) return;

    // computed 是惰性的；主动读取才能驱动其后续订阅通知。
    subscriber.add(
      effect(() => {
        try {
          source.get();
        } catch (error) {
          subscriber.error(error);
        }
      }),
    );
    if (subscriber.closed) return;

    // 首值回调可能写入源，此时后续订阅还未建立。
    const latest = source.get();
    if (!Object.is(current, latest)) subscriber.next(latest);
  });
}

export function fromObservable<T>(source: Observable<T>, initialValue: T): ObservableState<T> {
  const value = signal(initialValue);
  const status = signal<ObservableStatus>("active");
  const error = signal<unknown>(undefined);
  const subscription = source.subscribe({
    next(nextValue) {
      // 函数需要包装，undefined 则直接写入，避免被解释为无返回值的 recipe。
      if (typeof nextValue === "function") value.set(() => nextValue);
      else value.set(nextValue);
    },
    error(reason: unknown) {
      batch(() => {
        error.set(typeof reason === "function" ? () => reason : reason);
        status.set("error");
      });
    },
    complete() {
      status.set("complete");
    },
  });

  return {
    get: value.get,
    subscribe: value.subscribe,
    status: { get: status.get, subscribe: status.subscribe },
    error: { get: error.get, subscribe: error.subscribe },
    dispose() {
      subscription.unsubscribe();
      status.set("disposed");
    },
  };
}
export { createAutoImportApis } from "./auto-import-api.js";
