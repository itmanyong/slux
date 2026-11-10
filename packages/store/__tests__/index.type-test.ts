import type { Subscribable } from "@slux/core";
import {
  createStore,
  type StoreApi,
  type StateCreator,
  type SetStateFn,
  type GetStateFn,
  type Listener,
  type SetFn,
  type Middleware,
  type MiddlewareAPI,
  type StoreOptions,
} from "../src/index.js";

// 仅由 typecheck 编译，错误用例不会在运行时执行。
export function checkTypes(): void {
  interface State {
    count: number;
    name: string;
    increment(): void;
  }
  const creator: StateCreator<State> = (set, get) => {
    const write: SetStateFn<State> = set;
    const read: GetStateFn<State> = get;
    return {
      count: 0,
      name: "counter",
      increment: () => write({ count: read().count + 1 }),
    };
  };
  const middleware: Middleware<State> = {
    name: "typed",
    onSet: (api, next, partial) => {
      const access: MiddlewareAPI<State> = api;
      const write: SetFn<State> = next;
      const count: number = access.getState().count;
      write({ ...partial, count });
      // @ts-expect-error next 只接收部分状态，不接收 updater。
      next((state: State) => ({ count: state.count + 1 }));
    },
    onGet: (_api, key) => {
      const property: keyof State = key;
      void property;
    },
    onSubscribe: (_api, listener) => listener,
  };
  const options: StoreOptions<State> = { middleware: [middleware] };
  const store: StoreApi<State> = createStore<State>(creator, options);
  const source: Subscribable<State> = store;
  const count: number = source.get().count;
  const name: string = store.getInitialState().name;
  const listener: Listener<State> = (state, prev) => {
    const change: number = state.count - prev.count;
    void change;
  };
  const unsubscribe: () => void = store.subscribe(listener);
  store.subscribe((state, prev) => {
    const next: number = state.count;
    const previous: number = prev.count;
    // @ts-expect-error 双参数回调也保留完整状态类型，不能退化为 any。
    const incorrect: string = state.count;
    void [next, previous, incorrect];
  });
  const oneArgument: () => void = source.subscribe((state) => {
    const value: number = state.count;
    void value;
  });
  store.setState({ count: 1 });
  store.setState((state) => ({ count: state.count + 1 }));
  const inferred = createStore(() => ({ count: 0, name: "inferred" }));
  const inferredCount: number = inferred.getState().count;
  const inferredName: string = inferred.getState().name;
  // @ts-expect-error 部分状态仍限制字段类型。
  store.setState({ count: "wrong" });
  // @ts-expect-error 不允许写入未定义的状态字段。
  store.setState({ missing: 1 });
  // @ts-expect-error updater 必须返回匹配的部分状态。
  store.setState(() => ({ count: "wrong" }));
  // @ts-expect-error Store updater 必须返回部分状态，不是草稿写入接口。
  store.setState((state) => {
    state.count++;
  });
  // @ts-expect-error Store 状态必须是对象。
  createStore(() => 1);
  // @ts-expect-error 监听器参数必须与状态类型一致。
  store.subscribe((state: { count: string }) => {
    void state;
  });
  // @ts-expect-error Store 不暴露 Signal 的 set 方法。
  store.set({ count: 1 });
  void [count, name, unsubscribe, oneArgument, inferredCount, inferredName];
}
