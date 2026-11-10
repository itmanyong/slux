import { createStore } from "@slux/store";
import { history } from "@slux/history";

const undoHistory = history<{ value: number }>({ maxDepth: 2 });
const store = createStore<{ value: number }>(() => ({ value: 0 }), {
  middleware: [undoHistory],
});

store.setState({ value: 1 });
store.setState({ value: 2 });
store.setState({ value: 3 }); // 快照 0 已被挤出，past 只剩 [1, 2]

undoHistory.undo();
undoHistory.undo();
undoHistory.undo(); // 无效：已达历史边界
console.log(store.getState().value); // → 1
