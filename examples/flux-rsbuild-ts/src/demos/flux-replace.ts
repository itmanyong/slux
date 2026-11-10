import type { ExampleDemo } from "@slux/shell-example";
import { createFluxStore, type FluxReducer } from "@slux/flux";

type State = { items: string[]; total: number };
type Action = { type: "add"; item: string } | { type: "clear" };

const reducer: FluxReducer<State, Action> = (state, action) => {
  if (action.type === "add") {
    return { items: [...state.items, action.item], total: state.total + 1 };
  }
  return { items: [], total: 0 };
};

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const store = createFluxStore(reducer, { items: [], total: 0 });
  const listeners = new Set<() => void>();
  const stop = store.subscribe((state) => {
    context.log(`subscribe → state: ${JSON.stringify(state)}（整状态替换，不浅合并）`, "notify");
    for (const listener of listeners) listener();
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "total",
        emphasis: true,
        read: () => String(store.get().total),
      },
      {
        kind: "list",
        label: "items",
        read: () => store.get().items,
      },
      {
        kind: "text",
        label: "getState() vs getInitialState()",
        read: () => (store.getState() === store.getInitialState() ? "相同引用（未派发）" : "已替换为新对象"),
      },
    ],
    actions: [
      {
        id: "add",
        label: "ADD",
        primary: true,
        input: {
          kind: "text",
          placeholder: "要添加的条目",
          value: "learn flux",
        },
        run: (input) => {
          const item = input.trim();
          if (!item) {
            context.log("条目不能为空，dispatch 被跳过", "error");
            return;
          }
          store.dispatch({ type: "add", item });
          context.log(`dispatch({ type: "add", item: "${item}" })`, "write");
        },
      },
      {
        id: "clear",
        label: "CLEAR",
        run: () => {
          store.dispatch({ type: "clear" });
          context.log('dispatch({ type: "clear" })', "write");
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
