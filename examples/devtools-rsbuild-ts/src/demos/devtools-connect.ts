import { createStore } from "@slux/store";
import { devtools, inspect } from "@slux/devtools";
import type { InspectEvent } from "@slux/devtools";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;
type Log = (message: string, tone?: LogTone) => void;
type State = { count: number };

const MAX_EVENTS = 40;
const EXTENSION_KEY = "__REDUX_DEVTOOLS_EXTENSION__";

export function createDevtoolsConnectDemo(log: Log): DemoInstance {
  const events: string[] = [];
  const record = (event: InspectEvent): void => {
    const text = `${event.type} · ${event.storeName}${event.action === undefined ? "" : ` · ${event.action}`}`;
    events.push(text);
    if (events.length > MAX_EVENTS) events.shift();
    log(text, "notify");
  };

  const hasExtension = EXTENSION_KEY in globalThis;
  const unsubscribe = inspect(record);
  const store = createStore<State>(() => ({ count: 0 }), {
    middleware: [devtools<State>({ name: "BridgeStore" })],
  });
  log(hasExtension ? "检测到 Redux DevTools 扩展：动作将同步发送到面板" : "未检测到扩展：连接静默降级，检查器事件流照常工作", "info");

  return {
    readouts: [
      {
        kind: "text",
        label: "扩展检测",
        read: () => (hasExtension ? "已安装（动作发送到面板）" : "未安装（降级为 inspect 事件）"),
      },
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
        id: "bump10",
        label: "+ 10",
        run: () => {
          store.setState((state) => ({ count: state.count + 10 }));
        },
      },
    ],
    dispose: () => {
      store.destroy();
      unsubscribe();
    },
  };
}
