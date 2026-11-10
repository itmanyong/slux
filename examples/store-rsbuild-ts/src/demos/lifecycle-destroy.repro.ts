import { createStore } from "@slux/store";

const store = createStore<{ count: number }>(() => ({ count: 0 }));

store.setState({ count: 1 });
store.destroy();
store.setState({ count: 999 });
console.log(store.getState().count); // → 1（销毁后写入被忽略）
