import { createStore } from "@slux/store";
import { history } from "@slux/history";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** undo/redo 也走完整中间件链：store 订阅者对时间旅行同样可见。 */
export function createTravelNotifyDemo(log: Log): DemoInstance {
  const undoHistory = history<{ value: number }>();
  const store = createStore<{ value: number }>(() => ({ value: 0 }), {
    middleware: [undoHistory],
  });
  let notified = 0;
  store.subscribe((state, prevState) => {
    notified += 1;
    log(`listener #${notified}: ${prevState.value} → ${state.value}`, "notify");
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "value",
        emphasis: true,
        read: () => String(store.getState().value),
      },
      {
        kind: "metric",
        label: "通知次数",
        read: () => String(notified),
      },
    ],
    actions: [
      {
        id: "write",
        label: "写入 +N",
        primary: true,
        input: { kind: "number", placeholder: "步长", value: "1" },
        run(input) {
          const step = Number(input) || 0;
          store.setState((state) => ({ value: state.value + step }));
          log(`setState +${step} → ${store.getState().value}`, "write");
        },
      },
      {
        id: "undo",
        label: "undo()",
        run() {
          if (!undoHistory.canUndo.get()) {
            log("canUndo=false，没有可撤销的快照", "error");
            return;
          }
          undoHistory.undo();
          log(`undo → ${store.getState().value}（订阅者同样收到通知）`, "compute");
        },
      },
      {
        id: "redo",
        label: "redo()",
        run() {
          if (!undoHistory.canRedo.get()) {
            log("canRedo=false，没有可重做的快照", "error");
            return;
          }
          undoHistory.redo();
          log(`redo → ${store.getState().value}`, "compute");
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
