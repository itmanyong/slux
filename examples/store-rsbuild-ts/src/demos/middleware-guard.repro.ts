import { createStore, type Middleware } from "@slux/store";

const guard: Middleware<{ count: number }> = {
  name: "guard",
  onSet(api, next, partial) {
    const candidate = partial.count ?? api.getState().count;
    if (candidate < 0) {
      console.log("拦截:", candidate);
      return;
    }
    next(partial);
  },
};

const store = createStore<{ count: number }>(() => ({ count: 0 }), {
  middleware: [guard],
});

store.setState((state) => ({ count: state.count - 3 })); // → 拦截: -3
console.log(store.getState().count); // → 0（写入被拦截）
