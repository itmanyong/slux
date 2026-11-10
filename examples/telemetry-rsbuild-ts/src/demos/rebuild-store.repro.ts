import { createStore, type StoreApi } from "@slux/store";
import { telemetry } from "@slux/telemetry";

type State = { count: number };

const metrics = telemetry<State>({
  onStateChange: (meta) => console.log("report", meta.changeCount),
});

let store: StoreApi<State> = createStore(() => ({ count: 0 }), {
  middleware: [metrics],
});

store.setState({ count: 1 });
store.destroy();

store = createStore(() => ({ count: 0 }), { middleware: [metrics] });
store.setState({ count: 1 });
// → report 1
// → report 1
