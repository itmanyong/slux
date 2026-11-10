import type { ExampleDemo } from "@slux/shell-example";
import { createFluxStore, type FluxReducer } from "@slux/flux";

type State = { count: number };
type Action = { type: "add"; amount: number } | { type: "reset" };

const reducer: FluxReducer<State, Action> = (state, action) => (action.type === "add" ? { count: state.count + action.amount } : { count: 0 });

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const store = createFluxStore(reducer, { count: 0 });
  const listeners = new Set<() => void>();
  const stop = store.subscribe((state) => {
    context.log(`subscribe → count: ${state.count}`, "notify");
    for (const listener of listeners) listener();
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => String(store.get().count),
      },
    ],
    actions: [
      {
        id: "add1",
        label: "+ 1",
        run: () => {
          store.dispatch({ type: "add", amount: 1 });
          context.log('dispatch({ type: "add", amount: 1 })', "write");
        },
      },
      {
        id: "add5",
        label: "+ 5",
        run: () => {
          store.dispatch({ type: "add", amount: 5 });
          context.log('dispatch({ type: "add", amount: 5 })', "write");
        },
      },
      {
        id: "reset",
        label: "RESET",
        run: () => {
          store.dispatch({ type: "reset" });
          context.log('dispatch({ type: "reset" }) — reducer 返回完整新状态', "write");
        },
      },
    ],
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      stop();
      store.destroy();
    },
  };
};
