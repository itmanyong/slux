import { createStore } from "@slux/store";
import { devtools } from "@slux/devtools";

const hasExtension = "__REDUX_DEVTOOLS_EXTENSION__" in globalThis;

const store = createStore<{ count: number }>(() => ({ count: 0 }), {
  middleware: [devtools({ name: "BridgeStore" })],
});

store.setState({ count: 1 });
store.setState({ count: 11 });
console.log(hasExtension ? "connected" : "degraded");
// 有扩展时动作发到面板；没有扩展时连接静默降级，不影响 Store。
// → degraded
