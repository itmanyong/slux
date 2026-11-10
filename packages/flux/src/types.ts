import type { Subscribable } from "@slux/core";

export type FluxAction = { readonly type: string };

export type FluxReducer<State, Action extends FluxAction> = (state: State, action: Action) => State;

export type FluxDispatch<Action extends FluxAction> = (action: Action) => Action;

export type FluxMiddlewareAPI<State, Action extends FluxAction> = {
  getState(): State;
  dispatch: FluxDispatch<Action>;
};

/** 独立的 dispatch 管道，与 @slux/store 的状态写入中间件不兼容。 */
export type FluxMiddleware<State, Action extends FluxAction> = (
  api: FluxMiddlewareAPI<State, Action>,
) => (next: FluxDispatch<Action>) => FluxDispatch<Action>;

export type FluxStoreOptions<State, Action extends FluxAction> = {
  readonly middleware?: readonly FluxMiddleware<State, Action>[];
};

export type FluxStore<State, Action extends FluxAction> = Subscribable<State> & {
  getState(): State;
  getInitialState(): State;
  dispatch: FluxDispatch<Action>;
  destroy(): void;
};
