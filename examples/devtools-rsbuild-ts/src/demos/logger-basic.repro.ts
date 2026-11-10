import { createStore } from "@slux/store";
import { logger } from "@slux/devtools";

const store = createStore<{ count: number }>(() => ({ count: 0 }), {
  middleware: [logger({ name: "Demo", collapsed: false })],
});

store.setState({ count: 1 });
store.setState({ count: 2 });
// → ▸ Demo @ 12:00:00.000 set:count
// →   prev state {"count":0}
// →   action     set:count
// →   next state {"count":1}
// → ▸ Demo @ 12:00:00.001 set:count
// →   prev state {"count":1}
// →   action     set:count
// →   next state {"count":2}
