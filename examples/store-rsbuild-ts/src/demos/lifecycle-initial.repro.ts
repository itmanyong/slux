import { createStore } from "@slux/store";

const store = createStore<{ count: number }>(() => ({ count: 10 }));

store.setState({ count: 99 });
console.log(store.getState().count); // → 99
console.log(store.getInitialState().count); // → 10

store.setState(() => store.getInitialState());
console.log(store.getState().count); // → 10（回滚到初始快照）
