import { createStore } from "@slux/store";
import { devtools, inspect } from "@slux/devtools";
import type { InspectEvent } from "@slux/devtools";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;
type Log = (message: string, tone?: LogTone) => void;
type State = { count: number };

const MAX_EVENTS = 40;

export function createInspectFeedDemo(log: Log): DemoInstance {
  const events: string[] = [];
  const record = (event: InspectEvent): void => {
    const text = `${event.type} · ${event.storeName}${event.action === undefined ? "" : ` · ${event.action}`}`;
    events.push(text);
    if (events.length > MAX_EVENTS) events.shift();
    log(text, event.type === "init" ? "info" : "notify");
  };

  const unsubscribe = inspect(record);
  const store = createStore<State>(() => ({ count: 0 }), {
    middleware: [devtools<State>({ name: "FeedStore" })],
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => String(store.getState().count),
      },
      { kind: "list", label: "inspect 事件流", read: () => events.slice(-6) },
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
        id: "clear",
        label: "清空事件流",
        run: () => {
          events.length = 0;
          log("本地事件列表已清空，检查器仍在订阅", "info");
        },
      },
      {
        id: "detach",
        label: "注销检查器",
        title: "注销后 store 更新不再进入事件流",
        run: () => {
          unsubscribe();
          log("inspect 已注销：后续写入不再被记录", "scope");
        },
      },
    ],
    dispose: () => {
      store.destroy();
      unsubscribe();
    },
  };
}
