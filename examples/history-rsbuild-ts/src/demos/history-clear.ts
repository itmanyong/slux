import { createStore } from "@slux/store";
import { history } from "@slux/history";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** clear：一次性清空 past 与 future，clear 本身不入栈。 */
export function createHistoryClearDemo(log: Log): DemoInstance {
  const undoHistory = history<{ doc: string }>();
  const store = createStore<{ doc: string }>(() => ({ doc: "空白文档" }), {
    middleware: [undoHistory],
  });

  return {
    readouts: [
      {
        kind: "text",
        label: "当前文档",
        read: () => store.getState().doc,
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
        label: "写入文档",
        primary: true,
        input: { kind: "text", placeholder: "内容", value: "第一章" },
        run(input) {
          const text = input.trim();
          if (!text) {
            log("输入为空，未写入", "error");
            return;
          }
          store.setState({ doc: text });
          log(`写入 → "${text}"`, "write");
        },
      },
      {
        id: "clear",
        label: "clear()",
        run() {
          const hadHistory = undoHistory.canUndo.get() || undoHistory.canRedo.get();
          undoHistory.clear();
          log(hadHistory ? "clear → past/future 清空，canUndo/canRedo 复位为 false" : "clear → 历史本来就是空的", "notify");
        },
      },
      {
        id: "undo",
        label: "undo()",
        run() {
          if (!undoHistory.canUndo.get()) {
            log("canUndo=false：clear 之后无法撤销", "error");
            return;
          }
          undoHistory.undo();
          log(`undo → "${store.getState().doc}"`, "compute");
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
