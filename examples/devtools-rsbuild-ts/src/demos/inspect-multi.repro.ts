import { createStore } from "@slux/store";
import { devtools, inspect } from "@slux/devtools";

const unsubscribe = inspect((event) => console.log(event.storeName, event.action ?? event.type));

const cart = createStore<{ items: number }>(() => ({ items: 0 }), {
  middleware: [devtools({ name: "cart" })],
});
const profile = createStore<{ name: string }>(() => ({ name: "ada" }), {
  middleware: [devtools({ name: "profile" })],
});

cart.setState({ items: 1 });
profile.setState({ name: "bob" });
// → cart set:items
// → profile set:name
unsubscribe();
