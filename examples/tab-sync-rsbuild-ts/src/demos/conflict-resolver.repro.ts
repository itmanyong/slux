import { createStore } from "@slux/store";
import { broadcast } from "@slux/tab-sync";
import type { ConflictResolver } from "@slux/tab-sync";

type State = { count: number };

const keepHighest: ConflictResolver<State> = (incoming, current) => ({
  count: Math.max(incoming.count ?? 0, current.count),
});

const writer = createStore<State>(() => ({ count: 0 }), {
  middleware: [broadcast({ channel: "slux-demo-resolver" })],
});
const holder = createStore<State>(() => ({ count: 10 }), {
  middleware: [
    broadcast({
      channel: "slux-demo-resolver",
      conflictResolution: keepHighest,
    }),
  ],
});

writer.setState({ count: 3 });
console.log(holder.getState().count);
writer.setState({ count: 25 });
console.log(holder.getState().count);
// → 10
// → 25
