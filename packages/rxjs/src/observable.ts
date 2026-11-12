/**
 * @file @slux/rxjs 的桥接实现：在 @slux/core 的 Subscribable/signal 与 RxJS Observable 之间做双向转换，并投影流状态。
 */
import { batch, effect, signal } from "@slux/core";
import type { ReadonlySignal, Subscribable } from "@slux/core";
import { Observable } from "rxjs";

/**
 * 源 Observable 的生命周期状态："active" 仍可发射值；"complete" 正常完成；"error" 以错误终止；"disposed" 调用方主动释放后的终结态。状态只由 active 迁往其余三者，不回退。
 */
export type ObservableStatus = "active" | "complete" | "error" | "disposed";
/**
 * 由 RxJS Observable 投影出的状态对象：除按 Subscribable 方式读取/订阅值外，还暴露流状态、错误信息与主动释放入口。
 * @typeParam T 流承载的值类型
 * @remarks 生命周期结束时须由调用方调用 dispose 释放源订阅
 */
export type ObservableState<T> = Subscribable<T> & {
  /** 只读流状态信号，取值见 ObservableStatus */
  readonly status: ReadonlySignal<ObservableStatus>;
  /** 只读错误信号，未出错时为 undefined */
  readonly error: ReadonlySignal<unknown>;
  /** 退订源 Observable 并把状态置为 disposed */
  dispose(): void;
};

/**
 * 把 @slux/core 的 Subscribable 包装为 RxJS Observable：订阅时立即发出当前值，并转发后续变更。
 * @typeParam T 源承载的值类型
 * @param source 须提供 get() 读取与 subscribe(notify) 订阅（后者返回注销函数）的实例
 * @returns RxJS Observable<T>，登记的资源随 RxJS 退订一并释放
 * @remarks 订阅按「发首值 → 订阅源 → 建 effect → 补偿读取」的固定顺序建立：首值回调可能同步写入源，而此时源订阅尚未注册；惰性 computed 只有被主动读取才会登记依赖，故用 effect 主动读源驱动求值；末尾补读一次以防首值回调到订阅建立之间漏掉写入。effect 读取抛错会转为流的 error 通知并终止流
 */
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

    // computed 是惰性的，只有被主动读取才会登记依赖并触发后续通知：用 effect 读源驱动其求值，读取抛错转为流的 error 通知。
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

    // 首值回调可能在源订阅建立前写入源，末尾补读一次，值有变化则补发以免丢失该窗口内的更新。
    const latest = source.get();
    if (!Object.is(current, latest)) subscriber.next(latest);
  });
}

/**
 * 把 RxJS Observable 投影为 ObservableState：以三个独立 signal 分别跟踪值、状态与错误，调用时立即订阅源。
 * @typeParam T 流承载的值类型
 * @param source RxJS Observable<T>
 * @param initialValue 源尚未发射 next 时的初始值
 * @returns ObservableState<T>，须由调用方在生命周期结束时调用 dispose 退订
 * @remarks 发射值或错误本身是函数时会被包装后再写入，避免被 signal.set 当作更新函数执行；error 与 status 的写入放在同一 batch；dispose 后不再转发源发射
 */
export function fromObservable<T>(source: Observable<T>, initialValue: T): ObservableState<T> {
  const value = signal(initialValue);
  const status = signal<ObservableStatus>("active");
  const error = signal<unknown>(undefined);
  const subscription = source.subscribe({
    /** 把源发射的每个值写入 value signal */
    next(nextValue) {
      // 函数值包一层再写入，避免被 signal.set 当作更新函数（recipe）执行；error 分支同理。
      if (typeof nextValue === "function") value.set(() => nextValue);
      else value.set(nextValue);
    },
    /** 记录终止原因并把状态置为 error */
    error(reason: unknown) {
      batch(() => {
        error.set(typeof reason === "function" ? () => reason : reason);
        status.set("error");
      });
    },
    /** 正常完成时仅置状态，value 与 error 保持原值 */
    complete() {
      status.set("complete");
    },
  });

  return {
    get: value.get,
    subscribe: value.subscribe,
    status: { get: status.get, subscribe: status.subscribe },
    error: { get: error.get, subscribe: error.subscribe },
    /** 退订源并把状态置为 disposed，此后不再转发源发射 */
    dispose() {
      subscription.unsubscribe();
      status.set("disposed");
    },
  };
}
