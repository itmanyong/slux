import { createStore } from "@slux/store";
import { history } from "@slux/history";

const undoHistory = history<{ step: number }>();
const store = createStore<{ step: number }>(() => ({ step: 0 }), {
  middleware: [undoHistory],
});

undoHistory.canUndo.subscribe((can) => console.log("canUndo:", can));

store.setState({ step: 1 }); // → canUndo: true
undoHistory.undo(); // → canUndo: false
