import { createStore } from "@slux/store";
import { history } from "@slux/history";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** history 中间件：每次写入前压入快照，undo/redo 在 past 与 future 间移动。 */
export function createUndoRedoDemo(log: Log): DemoInstance {
  const undoHistory = history<{ text: string }>();
  const store = createStore<{ text: string }>(() => ({ text: "草稿 v0" }), {
    middleware: [undoHistory],
  });

  return {
    readouts: [
      {
        kind: "text",
        label: "当前文本",
        read: () => store.getState().text,
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
        label: "写入新文本",
        primary: true,
        input: { kind: "text", placeholder: "文本", value: "草稿 v1" },
        run(input) {
          const text = input.trim();
          if (!text) {
            log("输入为空，未写入", "error");
            return;
          }
          store.setState({ text });
          log(`setState → "${text}"（旧文本压入 past）`, "write");
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
          log(`undo → "${store.getState().text}"`, "compute");
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
          log(`redo → "${store.getState().text}"`, "compute");
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
