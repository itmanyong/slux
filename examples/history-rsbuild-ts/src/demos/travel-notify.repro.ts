import { createStore } from "@slux/store";
import { history } from "@slux/history";

const undoHistory = history<{ value: number }>();
const store = createStore<{ value: number }>(() => ({ value: 0 }), {
  middleware: [undoHistory],
});

store.subscribe((state, prevState) => {
  console.log(prevState.value, "→", state.value);
});

store.setState({ value: 1 }); // → 0 → 1
undoHistory.undo(); // → 1 → 0（撤销同样经过中间件链，订阅者可见）
