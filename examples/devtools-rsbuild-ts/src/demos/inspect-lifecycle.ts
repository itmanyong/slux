import { createStore } from "@slux/store";
import { devtools, inspect } from "@slux/devtools";
import type { InspectEvent } from "@slux/devtools";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;
type Log = (message: string, tone?: LogTone) => void;
type State = { count: number };

const MAX_EVENTS = 40;

export function createInspectLifecycleDemo(log: Log): DemoInstance {
  const events: string[] = [];
  const record = (event: InspectEvent): void => {
    const text = `${event.type} · ${event.storeName}${event.action === undefined ? "" : ` · ${event.action}`}`;
    events.push(text);
    if (events.length > MAX_EVENTS) events.shift();
    log(text, event.type === "destroy" ? "scope" : "notify");
  };

  const unsubscribe = inspect(record);
  let store = createStore<State>(() => ({ count: 0 }), {
    middleware: [devtools<State>({ name: "LifeStore" })],
  });
  let destroyed = false;

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => (destroyed ? "—" : String(store.getState().count)),
      },
      {
        kind: "text",
        label: "实例状态",
        read: () => (destroyed ? "已销毁" : "运行中"),
      },
      { kind: "list", label: "inspect 事件流", read: () => events.slice(-6) },
    ],
    actions: [
      {
        id: "inc",
        label: "+ 1",
        primary: true,
        run: () => {
          if (destroyed) {
            log("Store 已销毁，setState 无效", "error");
            return;
          }
          store.setState((state) => ({ count: state.count + 1 }));
        },
      },
      {
        id: "destroy",
        label: "销毁 Store",
        title: "onDestroy 会发出 destroy 检查事件",
        run: () => {
          if (destroyed) {
            log("已经是销毁状态", "info");
            return;
          }
          store.destroy();
          destroyed = true;
        },
      },
      {
        id: "rebuild",
        label: "重建 Store",
        run: () => {
          if (!destroyed) {
            log("先销毁当前 Store，再重建才有对比意义", "info");
            return;
          }
          store = createStore<State>(() => ({ count: 0 }), {
            middleware: [devtools<State>({ name: "LifeStore" })],
          });
          destroyed = false;
          log("新 Store 已挂上同名中间件，发出新的 init 事件", "info");
        },
      },
    ],
    dispose: () => {
      if (!destroyed) store.destroy();
      unsubscribe();
    },
  };
}
