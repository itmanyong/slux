import { createStore } from "@slux/store";
import { telemetry } from "@slux/telemetry";

const metrics = telemetry<{ count: number }>({
  onInit: (state, meta) => console.log("init", state, meta.timestamp),
  onSubscribe: (meta) => console.log("subscribe", meta.totalSubscriptions),
});

const store = createStore(() => ({ count: 0 }), { middleware: [metrics] });

const stop = store.subscribe(() => {});
// → init {"count":0} 2026-01-01T00:00:00.000Z
// → subscribe 1
stop();
