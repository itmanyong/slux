import { createStore } from "@slux/store";
import { history } from "@slux/history";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** maxDepth: 3 —— 写入次数超过上限时，最早的快照被挤出历史栈。 */
export function createMaxDepthDemo(log: Log): DemoInstance {
  const undoHistory = history<{ value: number }>({ maxDepth: 3 });
  const store = createStore<{ value: number }>(() => ({ value: 0 }), {
    middleware: [undoHistory],
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
        kind: "flow",
        label: "历史标志",
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
          store.setState((state) => ({ value: state.value + step }));
          log(`写入 → ${store.getState().value}（快照上限 3）`, "write");
        },
      },
      {
        id: "undo",
        label: "undo()",
        run() {
          const before = store.getState().value;
          undoHistory.undo();
          if (store.getState().value === before) {
            log("undo 无效：已达 maxDepth=3 的历史边界（最早快照被挤出）", "error");
            return;
          }
          log(`undo → ${store.getState().value}`, "compute");
        },
      },
      {
        id: "redo",
        label: "redo()",
        run() {
          const before = store.getState().value;
          undoHistory.redo();
          if (store.getState().value === before) {
            log("redo 无效：future 已空", "error");
            return;
          }
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
