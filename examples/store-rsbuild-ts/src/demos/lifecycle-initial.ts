import { createStore } from "@slux/store";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** getInitialState：无论写多少次，初始快照不变，可一键回滚。 */
export function createLifecycleInitialDemo(log: Log): DemoInstance {
  const store = createStore<{ count: number }>(() => ({ count: 10 }));

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => String(store.getState().count),
      },
      {
        kind: "text",
        label: "getInitialState()",
        read: () => JSON.stringify(store.getInitialState()),
      },
    ],
    actions: [
      {
        id: "write",
        label: "updater +N",
        primary: true,
        input: { kind: "number", placeholder: "步长", value: "1" },
        run(input) {
          const step = Number(input) || 0;
          store.setState((state) => ({ count: state.count + step }));
          log(`setState +${step} → ${store.getState().count}`, "write");
        },
      },
      {
        id: "rollback",
        label: "回滚到初始快照",
        run() {
          const initial = store.getInitialState();
          store.setState(() => initial);
          log(`setState(() => getInitialState()) → ${store.getState().count}`, "compute");
        },
      },
    ],
    subscribe(listener) {
      return store.subscribe(() => listener());
    },
    dispose() {
      store.destroy();
    },
  };
}
