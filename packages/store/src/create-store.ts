import { signal, type Signal } from "@slux/core";
import { runAll } from "@slux/shared";
import type { Listener, Middleware, SetFn, SetStateFn, StateCreator, StoreApi, StoreOptions } from "./types.js";

function buildSetChain<T>(rawSet: SetFn<T>, middleware: readonly Middleware<T>[], api: StoreApi<T>): SetFn<T> {
  let chain = rawSet;
  for (let index = middleware.length - 1; index >= 0; index--) {
    const onSet = middleware[index]?.onSet;
    if (onSet === undefined) continue;
    const next = chain;
    chain = (partial) => onSet(api, next, partial);
  }
  return chain;
}

/**
 * 创建一个 Store 实例。
 *
 * 初始化分两个阶段：
 * 1. 执行 creator：此时 signal 尚未创建，`set` 只是把状态合并到 `state` 变量，
 *    供 creator 在返回前读写；creator 的返回值即为最终初始状态。
 * 2. 以 creator 返回的 state 创建 signal，并把 `set` 替换为经过中间件链包装、
 *    最终写入 signal 的版本；随后初始化中间件并订阅 signal 变更。
 */
export function createStore<T extends object>(creator: StateCreator<T>, options?: StoreOptions<T>): StoreApi<T> {
  // state 始终保存最新已提交状态，供中间件与 setState 在 signal 之外直接读取。
  let state: T;
  // signal 未创建前 getState 直接读 state；创建后改读 signal 快照，保证引用稳定。
  let stateSignal: Signal<T> | undefined = undefined;
  let destroyed = false;
  const middleware = options?.middleware ?? [];
  // 记录已执行过 init 的中间件，destroy 时按序调用其 onDestroy。
  const initialized: Middleware<T>[] = [];
  const listeners = new Set<Listener<T>>();
  const getState = (): T => (stateSignal === undefined ? state : stateSignal.get());

  // 第一阶段的临时 set：creator 可能在返回前多次调用 set，这里只做对象浅合并，
  // 不触发任何通知；creator 返回值才是初始状态的最终来源。
  let set: SetFn<T> = (partial) => {
    state = Object.assign({}, state, partial);
  };
  // setState 是对外暴露的入口：函数式 updater 在此求值，再交给内部 set；
  // updater 求值与 set 解耦，使中间件链只需处理已解析的部分状态。
  const setState: SetStateFn<T> = (partial) => {
    if (destroyed) return;
    set(typeof partial === "function" ? partial(state) : partial);
  };

  const subscribe = (listener: Listener<T>): (() => void) => {
    if (destroyed) return () => {};
    // 从后向前包装 listener，数组首位的中间件最终成为最外层包装。
    let wrapped = listener;
    for (let index = middleware.length - 1; index >= 0; index--) {
      const onSubscribe = middleware[index]?.onSubscribe;
      if (onSubscribe !== undefined) wrapped = onSubscribe(api, wrapped);
    }
    listeners.add(wrapped);
    return () => {
      listeners.delete(wrapped);
    };
  };

  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    listeners.clear();
    unsubscribeSignal();
    // runAll 会收集所有 onDestroy 的错误并以 AggregateError 抛出，避免某个清理失败中断其余清理。
    runAll(initialized.map((entry) => () => entry.onDestroy?.(api)));
  };

  // 第一阶段：执行 creator。setState/getState 已就绪，creator 可在内部自由调用。
  state = creator(setState, getState);
  const initialState = state;
  const api: StoreApi<T> = {
    get: getState,
    getState,
    getInitialState: () => initialState,
    setState,
    subscribe,
    destroy,
  };

  // 第二阶段：创建 signal，并把内部 set 替换为"中间件链 → signal.set"的版本。
  const source = signal(state);
  stateSignal = source;
  set = buildSetChain(
    (partial) => {
      // 中间件可能保留 next；destroy 后不能借此绕过 setState 的生命周期检查。
      if (destroyed) return;
      state = Object.assign({}, state, partial);
      source.set(state);
    },
    middleware,
    api,
  );

  // previous 追踪上一次通知时的状态，作为 listener 的 prevState 参数。
  let previous = state;
  const unsubscribeSignal = source.subscribe((nextState) => {
    if (destroyed) return;
    const prevState = previous;
    previous = nextState;
    // 通知前先快照 listeners，避免某 listener 取消订阅时影响后续迭代；
    // 回调内再次检查 has，是因为 listener 可能在本轮通知中被其他 listener 移除。
    runAll(
      Array.from(listeners, (listener) => () => {
        if (listeners.has(listener)) listener(nextState, prevState);
      }),
    );
  });

  // 中间件 init 在 signal 与 set 链就绪后执行，init 中可安全调用 api 的所有方法。
  try {
    for (const entry of middleware) {
      if (destroyed) break;
      initialized.push(entry);
      entry.init?.(api);
    }
  } catch (error) {
    // 初始化失败也要清理已进入的中间件；同时保留初始化和清理错误。
    runAll([
      () => {
        throw error;
      },
      destroy,
    ]);
  }
  return api;
}
