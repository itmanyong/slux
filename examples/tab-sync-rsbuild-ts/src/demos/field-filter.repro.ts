import { createStore } from "@slux/store";
import { broadcast } from "@slux/tab-sync";

type State = { count: number; noise: number };

const editor = createStore<State>(() => ({ count: 0, noise: 0 }), {
  middleware: [
    broadcast<State>({
      channel: "slux-demo-filter",
      filter: (state) => ({ count: state.count }),
    }),
  ],
});
const viewer = createStore<State>(() => ({ count: 0, noise: 0 }), {
  middleware: [broadcast({ channel: "slux-demo-filter" })],
});

editor.setState({ count: 1, noise: 99 });
console.log(viewer.getState().count, viewer.getState().noise);
// → 1 0
