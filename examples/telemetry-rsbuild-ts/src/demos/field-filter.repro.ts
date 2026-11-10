import { createStore } from "@slux/store";
import { telemetry } from "@slux/telemetry";

type State = { count: number; noise: string };

const metrics = telemetry<State>({
  filter: (_prev, _next, partial) => "count" in partial,
  onStateChange: (meta) => console.log("report", JSON.stringify(meta.partial)),
});

const store = createStore(() => ({ count: 0, noise: "-" }), {
  middleware: [metrics],
});

store.setState({ count: 1 });
store.setState({ noise: "x" });
// → report {"count":1}
