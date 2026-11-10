import { createStore } from "@slux/store";
import { devtools, inspect, InspectEventType } from "@slux/devtools";

const unsubscribe = inspect((event) => console.log(event.type, event.storeName));

const store = createStore<{ count: number }>(() => ({ count: 0 }), {
  middleware: [devtools({ name: "LifeStore" })],
});

store.setState({ count: 1 });
store.destroy();
console.log(InspectEventType.DESTROY);
// → init LifeStore
// → set LifeStore
// → destroy LifeStore
// → destroy
unsubscribe();
