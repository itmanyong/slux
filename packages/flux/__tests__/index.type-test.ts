import type { Subscribable } from "@slux/core";
import {
  createFluxStore,
  type FluxAction,
  type FluxDispatch,
  type FluxMiddleware,
  type FluxMiddlewareAPI,
  type FluxReducer,
  type FluxStore,
  type FluxStoreOptions,
} from "../src/index.js";

// 错误用例仅由 TypeScript 验证，不在运行时执行。
export function checkTypes(): void {
  type Action = { type: "add"; amount: number } | { type: "reset" };
  const reducer: FluxReducer<number, Action> = (state, action) => (action.type === "add" ? state + action.amount : 0);
  const middleware: FluxMiddleware<number, Action> = (api) => (next) => (action) => {
    const access: FluxMiddlewareAPI<number, Action> = api;
    const dispatch: FluxDispatch<Action> = next;
    const state: number = access.getState();
    if (action.type === "add") {
      const amount: number = action.amount;
      void amount;
    }
    // @ts-expect-error action 联合不允许不存在的 type。
    access.dispatch({ type: "missing" });
    void state;
    return dispatch(action);
  };
  const options: FluxStoreOptions<number, Action> = {
    middleware: [middleware],
  };
  const explicit: FluxStore<number, Action> = createFluxStore<number, Action>(reducer, 0, options);
  const inferred = createFluxStore(reducer, 0);
  const source: Subscribable<number> = inferred;
  const state: number = inferred.get();
  const initial: number = inferred.getInitialState();
  const result: Action = inferred.dispatch({ type: "add", amount: 1 });
  const action: FluxAction = result;
  const stop: () => void = source.subscribe((value) => {
    const number: number = value;
    // @ts-expect-error 订阅值保留 number 类型。
    const incorrect: string = value;
    void [number, incorrect];
  });
  // @ts-expect-error add action 必须携带 amount。
  inferred.dispatch({ type: "add" });
  // @ts-expect-error action 不允许未知类型。
  inferred.dispatch({ type: "missing" });
  // @ts-expect-error action payload 类型不能变化。
  inferred.dispatch({ type: "add", amount: "wrong" });
  // @ts-expect-error reducer 必须返回完整的 State。
  createFluxStore((_state: { count: number }, _action: Action) => ({}), {
    count: 0,
  });
  // @ts-expect-error action 必须有字符串 type。
  createFluxStore((state: number, _action: { value: number }) => state, 0);
  // @ts-expect-error Flux 不提供直接写入方法。
  inferred.setState(1);
  // @ts-expect-error 订阅回调不能要求第二个参数。
  inferred.subscribe((_next: number, _previous: number) => {});
  const functionStore = createFluxStore(
    (_state: () => number, _action: Action) => () => 2,
    () => 1,
  );
  const functionState: () => number = functionStore.getState();
  void [explicit, state, initial, action, stop, functionState];
}
