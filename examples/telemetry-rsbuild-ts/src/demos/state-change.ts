import { createStore } from "@slux/store";
import { telemetry } from "@slux/telemetry";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;
type State = { count: number; label: string };

export function createStateChangeDemo(log: Log): DemoInstance {
  let reported = 0;
  let lastEvent = "—";

  const metrics = telemetry<State>({
    onStateChange: (meta) => {
      reported += 1;
      lastEvent = `#${meta.changeCount} ${JSON.stringify(meta.partial)} · ${meta.durationMs.toFixed(2)}ms`;
      log(`上报 #${meta.changeCount}：${JSON.stringify(meta.partial)}，耗时 ${meta.durationMs.toFixed(2)}ms`, "notify");
    },
  });

  const store = createStore<State>(() => ({ count: 0, label: "draft" }), {
    middleware: [metrics],
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => String(store.getState().count),
      },
      { kind: "metric", label: "上报次数", read: () => String(reported) },
      { kind: "text", label: "最近事件", read: () => lastEvent },
    ],
    actions: [
      {
        id: "inc",
        label: "+ 1",
        primary: true,
        run: () => {
          store.setState((state) => ({ count: state.count + 1 }));
        },
      },
      {
        id: "bump5",
        label: "+ 5",
        run: () => {
          store.setState((state) => ({ count: state.count + 5 }));
        },
      },
      {
        id: "rename",
        label: "只改 label",
        title: "partial 只含 label，count 读数不变",
        run: () => {
          store.setState({ label: `draft-${store.getState().count}` });
        },
      },
    ],
    dispose: () => {
      store.destroy();
    },
  };
}
