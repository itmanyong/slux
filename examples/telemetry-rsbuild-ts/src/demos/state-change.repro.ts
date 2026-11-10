import { createStore } from "@slux/store";
import { telemetry } from "@slux/telemetry";

const metrics = telemetry<{ count: number }>({
  onStateChange: (meta) => console.log(`#${meta.changeCount} ${JSON.stringify(meta.partial)}`),
});

const store = createStore(() => ({ count: 0 }), { middleware: [metrics] });

store.setState({ count: 1 });
store.setState({ count: 2 });
// → #1 {"count":1}
// → #2 {"count":2}
