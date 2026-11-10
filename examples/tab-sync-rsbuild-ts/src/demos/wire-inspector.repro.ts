import { createStore } from "@slux/store";
import { broadcast } from "@slux/tab-sync";

const store = createStore<{ count: number }>(() => ({ count: 0 }), {
  middleware: [broadcast({ channel: "slux-demo-wire" })],
});

const eavesdrop = new BroadcastChannel("slux-demo-wire");
eavesdrop.onmessage = (event) => {
  console.log(event.data.state, event.data.senderId.slice(0, 8));
};

store.setState({ count: 1 });
store.setState({ count: 2 });
// → {"count":1} 9a1b2c3d
// → {"count":2} 9a1b2c3d
eavesdrop.close();
