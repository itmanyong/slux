import { signal } from "@slux/core";
import type { FluxAction, FluxDispatch, FluxReducer, FluxStore, FluxStoreOptions } from "./types.js";

export function createFluxStore<State, Action extends FluxAction>(
  reducer: FluxReducer<State, Action>,
  initialState: State,
  options?: FluxStoreOptions<State, Action>,
): FluxStore<State, Action> {
  const source = signal(initialState);
  let currentState = initialState;
  const subscriptions = new Set<() => void>();
  let destroyed = false;
  let reducing = false;
  let initializing = true;

  const reduce: FluxDispatch<Action> = (action) => {
    if (destroyed) return action;
    if (reducing) throw new Error("Cannot dispatch while the reducer is executing");
    let nextState: State;
    reducing = true;
    try {
      nextState = reducer(currentState, action);
    } finally {
      reducing = false;
    }
    currentState = nextState;
    // 函数状态必须作为返回值写入，不能被 signal 当作 recipe 调用。
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
    subscribe(callback) {
      if (destroyed) return () => {};
      const unsubscribe = source.subscribe(callback);
      const stop = () => {
        unsubscribe();
        subscriptions.delete(stop);
      };
      subscriptions.add(stop);
      return stop;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const stop of subscriptions) stop();
    },
  };

  const middlewareAPI = { getState: source.get, dispatch };
  const middleware = (options?.middleware ?? []).map((entry) => entry(middlewareAPI));
  for (let index = middleware.length - 1; index >= 0; index--) {
    chain = middleware[index]!(chain);
  }
  initializing = false;
  return api;
}
