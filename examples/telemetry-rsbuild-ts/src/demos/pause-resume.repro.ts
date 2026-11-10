import { createStore } from "@slux/store";
import { telemetry } from "@slux/telemetry";

const metrics = telemetry<{ count: number }>({
  onStateChange: (meta) => console.log("report", meta.changeCount),
});

const store = createStore(() => ({ count: 0 }), { middleware: [metrics] });

store.setState({ count: 1 });
metrics.setEnabled(false);
store.setState({ count: 2 });
metrics.setEnabled(true);
store.setState({ count: 3 });
// → report 1
// → report 3
