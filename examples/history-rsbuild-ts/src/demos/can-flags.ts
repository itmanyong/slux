import { createStore } from "@slux/store";
import { history } from "@slux/history";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** canUndo/canRedo 是 signal：不触发写入也能被订阅，标志位变化即推送。 */
export function createCanFlagsDemo(log: Log): DemoInstance {
  const undoHistory = history<{ step: number }>();
  const store = createStore<{ step: number }>(() => ({ step: 0 }), {
    middleware: [undoHistory],
  });

  undoHistory.canUndo.subscribe((can) => {
    log(`signal canUndo → ${can}`, "info");
  });
  undoHistory.canRedo.subscribe((can) => {
    log(`signal canRedo → ${can}`, "info");
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "step",
        emphasis: true,
        read: () => String(store.getState().step),
      },
      {
        kind: "flow",
        label: "信号标志",
        read: () => [
          { label: "canUndo", value: String(undoHistory.canUndo.get()) },
          { label: "canRedo", value: String(undoHistory.canRedo.get()) },
        ],
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
          store.setState((state) => ({ step: state.step + step }));
          log(`写入 → ${store.getState().step}`, "write");
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
          log(`undo → ${store.getState().step}`, "compute");
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
          log(`redo → ${store.getState().step}`, "compute");
        },
      },
    ],
    subscribe(listener) {
      const offUndo = undoHistory.canUndo.subscribe(listener);
      const offRedo = undoHistory.canRedo.subscribe(listener);
      return () => {
        offUndo();
        offRedo();
      };
    },
    dispose() {
      store.destroy();
    },
  };
}
