import { createFluxStore, type FluxMiddleware } from "@slux/flux";

type Action = { type: "add"; amount: number };

const blockNegative: FluxMiddleware<number, Action> = () => (next) => (action) => (action.amount < 0 ? action : next(action)); // 省略 next 即阻断
const double: FluxMiddleware<number, Action> = () => (next) => (action) => next({ ...action, amount: action.amount * 2 });

const store = createFluxStore((state: number, action: Action) => state + action.amount, 10, {
  middleware: [blockNegative, double],
});

store.dispatch({ type: "add", amount: 3 }); // 改写为 6
console.log(store.getState()); // → 预期输出: 16
store.dispatch({ type: "add", amount: -5 }); // 被阻断
console.log(store.getState()); // → 预期输出: 16
store.destroy();
