import { createStore } from "@slux/store";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** createStore：creator 定义初始状态，setState 以对象合并或函数 updater 写入。 */
export function createStoreDemo(log: Log): DemoInstance {
  const store = createStore<{ count: number }>(() => ({ count: 0 }));

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
        label: "getState()",
        read: () => JSON.stringify(store.getState()),
      },
    ],
    actions: [
      {
        id: "updater",
        label: "updater +N",
        primary: true,
        input: { kind: "number", placeholder: "步长", value: "1" },
        run(input) {
          const step = Number(input) || 0;
          store.setState((state) => ({ count: state.count + step }));
          log(`setState((s) => s.count + ${step}) → ${store.getState().count}`, "write");
        },
      },
      {
        id: "merge",
        label: "对象合并 set(42)",
        run() {
          store.setState({ count: 42 });
          log("setState({ count: 42 }) → 42", "write");
        },
      },
      {
        id: "reset",
        label: "归零",
        run() {
          store.setState({ count: 0 });
          log("setState({ count: 0 }) → 0", "write");
        },
      },
    ],
  };
}
