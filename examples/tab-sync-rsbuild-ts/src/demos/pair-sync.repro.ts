import { createStore } from "@slux/store";
import { broadcast } from "@slux/tab-sync";

const a = createStore<{ count: number }>(() => ({ count: 0 }), {
  middleware: [broadcast({ channel: "slux-demo-pair" })],
});
const b = createStore<{ count: number }>(() => ({ count: 0 }), {
  middleware: [broadcast({ channel: "slux-demo-pair" })],
});

a.setState({ count: 1 });
console.log(b.getState().count);
b.setState({ count: 5 });
console.log(a.getState().count);
// → 1
// → 5
