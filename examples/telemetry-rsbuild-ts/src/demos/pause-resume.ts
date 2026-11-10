import { createStore } from "@slux/store";
import { telemetry } from "@slux/telemetry";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;
type State = { count: number };

export function createPauseResumeDemo(log: Log): DemoInstance {
  let writes = 0;

  const metrics = telemetry<State>({
    onStateChange: (meta) => {
      log(`上报 #${meta.changeCount}：count=${String(meta.nextState.count)}`, "notify");
    },
  });

  const store = createStore<State>(() => ({ count: 0 }), {
    middleware: [metrics],
  });
  const stopStore = store.subscribe(() => {
    writes += 1;
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => String(store.getState().count),
      },
      { kind: "metric", label: "累计更新", read: () => String(writes) },
      {
        kind: "text",
        label: "上报开关",
        read: () => (metrics.isEnabled() ? "启用中" : "已暂停"),
      },
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
        id: "toggle",
        label: "暂停 / 恢复上报",
        title: "暂停期间状态照常更新，只是不再上报",
        run: () => {
          const next = !metrics.isEnabled();
          metrics.setEnabled(next);
          log(next ? "已恢复上报" : "已暂停上报（changeCount 仍累计）", "scope");
        },
      },
    ],
    dispose: () => {
      stopStore();
      store.destroy();
    },
  };
}
