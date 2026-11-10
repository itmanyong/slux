import { createStore, type Middleware } from "@slux/store";

const audit: Middleware<{ count: number }> = {
  name: "audit",
  onSet(_api, next, partial) {
    console.log("audit:", JSON.stringify(partial));
    next(partial);
  },
};

const store = createStore<{ count: number }>(() => ({ count: 0 }), {
  middleware: [audit],
});

store.setState({ count: 1 }); // → audit: {"count":1}
console.log(store.getState().count); // → 1
