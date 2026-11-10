import { createStore } from "@slux/store";
import { telemetry } from "@slux/telemetry";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;
type State = { count: number; noise: number };

export function createFieldFilterDemo(log: Log): DemoInstance {
  let reported = 0;
  let writes = 0;
  let notify: (() => void) | undefined;

  const metrics = telemetry<State>({
    filter: (_prev, _next, partial) => "count" in partial,
    onStateChange: (meta) => {
      reported += 1;
      log(`filter 放行，上报 ${JSON.stringify(meta.partial)}`, "notify");
    },
  });

  const store = createStore<State>(() => ({ count: 0, noise: 0 }), {
    middleware: [metrics],
  });
  const stopStore = store.subscribe(() => {
    writes += 1;
    notify?.();
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => String(store.getState().count),
      },
      {
        kind: "metric",
        label: "noise",
        read: () => String(store.getState().noise),
      },
      { kind: "metric", label: "上报次数", read: () => String(reported) },
      {
        kind: "metric",
        label: "已被过滤",
        read: () => String(writes - reported),
      },
    ],
    actions: [
      {
        id: "inc",
        label: "count + 1",
        primary: true,
        run: () => {
          store.setState((state) => ({ count: state.count + 1 }));
        },
      },
      {
        id: "noise",
        label: "noise + 1",
        run: () => {
          store.setState((state) => ({ noise: state.noise + 1 }));
          log("partial 只有 noise，filter 返回 false：写入成功但不上报", "info");
        },
      },
      {
        id: "both",
        label: "两个字段一起改",
        title: "partial 含 count 即放行",
        run: () => {
          store.setState((state) => ({
            count: state.count + 1,
            noise: state.noise + 1,
          }));
        },
      },
    ],
    subscribe: (listener) => {
      notify = listener;
      return () => {
        notify = undefined;
      };
    },
    dispose: () => {
      stopStore();
      store.destroy();
    },
  };
}
