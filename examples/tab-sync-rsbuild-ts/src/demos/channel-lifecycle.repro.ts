import { createStore } from "@slux/store";
import { broadcast } from "@slux/tab-sync";

const writer = createStore<{ count: number }>(() => ({ count: 0 }), {
  middleware: [broadcast({ channel: "slux-demo-lifecycle" })],
});
let viewer = createStore<{ count: number }>(() => ({ count: 0 }), {
  middleware: [broadcast({ channel: "slux-demo-lifecycle" })],
});

writer.setState({ count: 1 });
console.log(viewer.getState().count);

viewer.destroy();
writer.setState({ count: 2 });
console.log(viewer.getState().count);

viewer = createStore<{ count: number }>(() => ({ count: 0 }), {
  middleware: [broadcast({ channel: "slux-demo-lifecycle" })],
});
writer.setState({ count: 3 });
console.log(viewer.getState().count);
// → 1
// → 0
// → 3
