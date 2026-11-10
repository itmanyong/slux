import { createFluxStore, type FluxMiddleware } from "@slux/flux";

type Action = { type: "add"; amount: number };

const logger =
  (name: string): FluxMiddleware<number, Action> =>
  () =>
  (next) =>
  (action) => {
    console.log(`${name} before`);
    const returned = next(action);
    console.log(`${name} after`);
    return returned;
  };

const store = createFluxStore((state: number, action: Action) => state + action.amount, 0, {
  middleware: [logger("A"), logger("B")],
});

store.dispatch({ type: "add", amount: 1 });
// → 预期输出: A before / B before / B after / A after（数组第一项在最外层）
console.log(store.getState()); // → 预期输出: 1
store.destroy();
