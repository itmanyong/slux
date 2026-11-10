import { createFluxStore, type FluxReducer } from "@slux/flux";

type State = { count: number };
type Action = { type: "add"; amount: number } | { type: "reset" };

const reducer: FluxReducer<State, Action> = (state, action) => (action.type === "add" ? { count: state.count + action.amount } : { count: 0 });

const store = createFluxStore(reducer, { count: 0 });
store.subscribe((state) => console.log("count:", state.count)); // 不立即通知

store.dispatch({ type: "add", amount: 2 }); // → 预期输出: count: 2
store.dispatch({ type: "add", amount: 1 }); // → 预期输出: count: 3
store.dispatch({ type: "reset" }); // → 预期输出: count: 0
store.destroy();
