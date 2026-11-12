/**
 * @file @slux/flux 的 store 实现：用 @slux/core 的 signal 持有状态，组装 middleware 派发链、订阅登记与销毁释放。
 * signal 原语来自 @slux/core，公共类型契约见 ./types.js。
 */
import { signal } from "@slux/core";
import type { FluxAction, FluxDispatch, FluxReducer, FluxStore, FluxStoreOptions } from "./types.js";

/**
 * 按 reducer、初始状态与可选项构造一个 FluxStore。
 * @typeParam State store 的状态类型
 * @typeParam Action 受 FluxAction 约束的 action 类型
 * @param reducer 归约函数，每次派发调用一次
 * @param initialState 初始状态，同时作为 getInitialState 的固定返回值
 * @param options 可选构造项，middleware 省略时按空数组处理
 * @returns FluxStore<State, Action>，生命周期结束后须调用 destroy 释放订阅
 * @throws reducer 执行期间重入派发、middleware 初始化完成前派发均抛错；reducer 自身的异常经标志复位后原样向上传递
 * @remarks middleware 链按数组顺序从后往前包裹，首个中间件位于链最外层、最先接触派发；销毁后 dispatch 静默返回 action、subscribe 返回空注销函数
 * @see FluxStore 返回契约
 */
export function createFluxStore<State, Action extends FluxAction>(
  reducer: FluxReducer<State, Action>,
  initialState: State,
  options?: FluxStoreOptions<State, Action>,
): FluxStore<State, Action> {
  const source = signal(initialState);
  // 独立镜像「上一次归约结果」传给下一次 reducer，不依赖 signal 的读取时机。
  let currentState = initialState;
  const subscriptions = new Set<() => void>();
  let destroyed = false;
  let reducing = false;
  let initializing = true;

  // 派发链的终点，真正执行归约并写回状态。
  const reduce: FluxDispatch<Action> = (action) => {
    if (destroyed) return action;
    if (reducing) throw new Error("Cannot dispatch while the reducer is executing");
    let nextState: State;
    reducing = true;
    try {
      nextState = reducer(currentState, action);
    } finally {
      reducing = false; // 异常路径也复位，避免标志永久置位
    }
    currentState = nextState;
    // 函数类型的状态须包一层再写入，否则会被 signal 当作更新函数（recipe）执行。
    if (typeof nextState === "function") source.set(() => nextState);
    else source.set(nextState);
    return action;
  };
  let chain = reduce;
  const dispatch: FluxDispatch<Action> = (action) => {
    if (destroyed) return action;
    if (reducing) throw new Error("Cannot dispatch while the reducer is executing");
    if (initializing) throw new Error("Cannot dispatch while middleware is initializing");
    return chain(action);
  };
  const api: FluxStore<State, Action> = {
    get: source.get,
    getState: source.get,
    getInitialState: () => initialState,
    dispatch,
    /** 登记一个状态订阅，返回其注销函数；销毁后登记静默无效 */
    subscribe(callback) {
      if (destroyed) return () => {};
      const unsubscribe = source.subscribe(callback);
      const stop = () => {
        unsubscribe();
        subscriptions.delete(stop); // 从登记集合移除自身，避免 destroy 时重复释放
      };
      subscriptions.add(stop);
      return stop;
    },
    /** 销毁 store：置位标志并释放所有已登记订阅；重复调用幂等 */
    destroy() {
      if (destroyed) return;
      destroyed = true; // 先置位再释放，防止释放过程中发生新的派发或订阅
      for (const stop of subscriptions) stop();
    },
  };

  const middlewareAPI = { getState: source.get, dispatch };
  const middleware = (options?.middleware ?? []).map((entry) => entry(middlewareAPI));
  // 倒序包裹：保证数组首个中间件最终位于链最外层、最先接触派发。
  for (let index = middleware.length - 1; index >= 0; index--) {
    chain = middleware[index]!(chain);
  }
  initializing = false;
  return api;
}
