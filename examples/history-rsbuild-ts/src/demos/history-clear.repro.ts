import { createStore } from "@slux/store";
import { history } from "@slux/history";

const undoHistory = history<{ doc: string }>();
const store = createStore<{ doc: string }>(() => ({ doc: "空白" }), {
  middleware: [undoHistory],
});

store.setState({ doc: "第一章" });
undoHistory.clear();
console.log(undoHistory.canUndo.get()); // → false

undoHistory.undo();
console.log(store.getState().doc); // → 第一章（clear 后无法撤销）
