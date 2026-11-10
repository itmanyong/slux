import { createStore } from "@slux/store";
import { telemetry } from "@slux/telemetry";

const metrics = telemetry<{ count: number }>({
  onStateChange: () => {
    throw new Error("上报服务不可用");
  },
  onError: (context) => console.error(context.source, context.error),
});

const store = createStore(() => ({ count: 0 }), { middleware: [metrics] });

store.setState({ count: 1 });
console.log(store.getState().count);
// → onStateChange Error: 上报服务不可用
// → 1
