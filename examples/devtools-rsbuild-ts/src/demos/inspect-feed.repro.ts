import { createStore } from "@slux/store";
import { devtools, inspect } from "@slux/devtools";

const unsubscribe = inspect((event) => console.log(event.type, event.storeName, event.action ?? ""));

const store = createStore<{ count: number }>(() => ({ count: 0 }), {
  middleware: [devtools({ name: "FeedStore" })],
});

store.setState({ count: 1 });
store.setState({ count: 2 });
// → init FeedStore
// → set FeedStore set:count
// → set FeedStore set:count
unsubscribe();
