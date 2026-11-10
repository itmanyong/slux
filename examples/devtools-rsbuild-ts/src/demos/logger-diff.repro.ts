import { createStore } from "@slux/store";
import { logger } from "@slux/devtools";

const store = createStore<{ count: number; price: number }>(() => ({ count: 0, price: 100 }), {
  middleware: [
    logger({
      diff: true,
      actionName: (partial) => ("price" in partial ? "SET_PRICE" : "SET_COUNT"),
    }),
  ],
});

store.setState({ count: 1 });
store.setState({ price: 120 });
// → ▸ Slux @ 12:00:00.000 SET_COUNT
// →   prev state {"count":0,"price":100}
// →   action     SET_COUNT
// →   next state {"count":1,"price":100}
// →   diff       {"count":{"prev":0,"next":1}}
// → ▸ Slux @ 12:00:00.001 SET_PRICE
// →   diff       {"price":{"prev":100,"next":120}}
