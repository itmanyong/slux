import { createFluxStore, type FluxReducer } from "@slux/flux";

type State = { items: string[]; total: number };
type Action = { type: "add"; item: string } | { type: "clear" };

const reducer: FluxReducer<State, Action> = (state, action) => {
  if (action.type === "add") {
    return { items: [...state.items, action.item], total: state.total + 1 };
  }
  return { items: [], total: 0 };
};

const store = createFluxStore(reducer, { items: [], total: 0 });
console.log(store.getState() === store.getInitialState()); // 初始引用 → 预期输出: true

store.dispatch({ type: "add", item: "a" });
console.log(store.getState() === store.getInitialState()); // 整状态替换 → 预期输出: false
console.log(store.getState()); // → 预期输出: { items: ["a"], total: 1 }
store.dispatch({ type: "clear" });
console.log(store.getState()); // → 预期输出: { items: [], total: 0 }
