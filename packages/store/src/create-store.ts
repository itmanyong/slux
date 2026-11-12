/**
 * @file 实现 createStore：以 signal 承载状态，支持中间件链、订阅与销毁。
 * 初始化分两阶段（先执行 creator 取初始状态，再建立 signal 与中间件链），顺序不可颠倒。
 */
import { signal, type Signal } from "@slux/core";
import { runAll } from "@slux/shared";
import type { Listener, Middleware, SetFn, SetStateFn, StateCreator, StoreApi, StoreOptions } from "./types.js";

/**
 * 由原始写入函数与各中间件的 onSet 组装出最终的写入链。
 * @param rawSet 链的末端写入函数。
 * @param middleware 只读中间件数组，数组顺序决定包装层次。
 * @param api 传给每个 onSet 的 Store API。
 * @returns 组装后的写入函数，调用会逐层经过各 onSet 后抵达 rawSet。
 */
function buildSetChain<T>(rawSet: SetFn<T>, middleware: readonly Middleware<T>[], api: StoreApi<T>): SetFn<T> {
  let chain = rawSet;
  // 从后向前遍历，使数组靠前的中间件包在最外层、最先被调用。
  for (let index = middleware.length - 1; index >= 0; index--) {
    const onSet = middleware[index]?.onSet;
    if (onSet === undefined) continue;
    // 先固定当前链为 next，避免闭包捕获到后续被改写的 chain。
    const next = chain;
    chain = (partial) => onSet(api, next, partial);
  }
  return chain;
}

/**
 * 创建一个 Store 实例。
 * @param creator 状态创建函数，返回初始状态 T。
 * @param options 可选配置，缺省时不启用中间件。
 * @returns StoreApi<T> 实例。
 * @remarks 中间件 init 抛错时，先清理已进入的中间件，并把初始化错误与清理错误一并汇总抛出。
 * @see StateCreator
 * @see StoreApi
 * @see buildSetChain
 */
export function createStore<T extends object>(creator: StateCreator<T>, options?: StoreOptions<T>): StoreApi<T> {
  // state 始终保存最新已提交状态；signal 未创建前由它单独承载状态。
  let state: T;
  let stateSignal: Signal<T> | undefined = undefined;
  let destroyed = false;
  const middleware = options?.middleware ?? [];
  // 记录已执行过 init 的中间件，destroy 时按序调用其 onDestroy。
  const initialized: Middleware<T>[] = [];
  const listeners = new Set<Listener<T>>();
  const getState = (): T => (stateSignal === undefined ? state : stateSignal.get());

  // 第一阶段的临时 set：creator 内调用时只做浅合并，不触发通知；creator 返回值才是初始状态。
  let set: SetFn<T> = (partial) => {
    state = Object.assign({}, state, partial);
  };
  // updater 求值与 set 解耦，使中间件链只需处理已解析的部分状态。
  const setState: SetStateFn<T> = (partial) => {
    if (destroyed) return;
    set(typeof partial === "function" ? partial(state) : partial);
  };

  /**
   * 注册状态变化监听器，经各中间件 onSubscribe 由内向外包装后加入集合。
   * @param listener 原始监听器，接收新状态与前一状态。
   * @returns 注销函数；已销毁时返回空操作函数。
   */
  const subscribe = (listener: Listener<T>): (() => void) => {
    if (destroyed) return () => {};
    // 与写入链同向：从后向前包装，数组首位的中间件成为最外层。
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

  /**
   * 销毁 Store：抑制后续读写、清空监听器、退订 signal 并逐个调用已进入中间件的销毁钩子。
   * 幂等；清理钩子的错误由 runAll 汇总抛出，单个失败不中断其余清理。
   */
  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    listeners.clear();
    unsubscribeSignal();
    runAll(initialized.map((entry) => () => entry.onDestroy?.(api)));
  };

  // 第一阶段：执行 creator，先取得初始状态才能据此创建 signal。
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

  // init 在 signal 与 set 链就绪后执行，init 中可安全调用 api 的所有方法。
  try {
    // 先登记再调用，保证清理时只处理确实进入过的中间件。
    for (const entry of middleware) {
      if (destroyed) break;
      initialized.push(entry);
      entry.init?.(api);
    }
  } catch (error) {
    // 初始化失败也要清理已进入的中间件；数组按「重抛 init 错误 → 执行 destroy」排列，
    // 使初始化失败时仍完成已进入中间件的清理。
    runAll([
      () => {
        throw error;
      },
      destroy,
    ]);
  }
  return api;
}
