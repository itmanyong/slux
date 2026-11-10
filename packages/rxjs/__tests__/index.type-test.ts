import type { ReadonlySignal, Subscribable } from "@slux/core";
import { signal } from "@slux/core";
import { Observable, of } from "rxjs";
import { fromObservable, toObservable } from "../src/index.js";
import type { ObservableState, ObservableStatus } from "../src/index.js";

export function checkTypes(): void {
  const observable: Observable<number> = toObservable(signal(0));
  const state: ObservableState<number> = fromObservable(observable, 0);
  const readable: Subscribable<number> = state;
  const status: ReadonlySignal<ObservableStatus> = state.status;
  const error: ReadonlySignal<unknown> = state.error;
  const fn = () => 1;
  const callable: (() => number) | undefined = fromObservable<(() => number) | undefined>(of(fn), undefined).get();
  state.dispose();
  // @ts-expect-error 桥接只允许从 Observable 更新值。
  state.set(1);
  // @ts-expect-error 状态只读。
  state.status.set("active");
  // @ts-expect-error 错误只读。
  state.error.set(new Error());
  // @ts-expect-error 初始值类型必须匹配。
  fromObservable(observable, "wrong");
  // @ts-expect-error 必须显式提供初始值。
  fromObservable(observable);
  // @ts-expect-error toObservable 接受具有 get/subscribe 的状态源。
  toObservable(observable);
  void [readable, status, error, callable];
}
