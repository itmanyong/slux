import { createStore } from "@slux/store";
import { history } from "@slux/history";

const undoHistory = history<{ text: string }>();
const store = createStore<{ text: string }>(() => ({ text: "v0" }), {
  middleware: [undoHistory],
});

store.setState({ text: "v1" });
store.setState({ text: "v2" });

undoHistory.undo();
console.log(store.getState().text); // → v1
console.log(undoHistory.canRedo.get()); // → true

undoHistory.redo();
console.log(store.getState().text); // → v2
