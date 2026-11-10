import { createStore } from "@slux/store";

const store = createStore<{ count: number }>(() => ({ count: 0 }));

store.setState({ count: 42 });
console.log(store.getState().count); // → 42

store.setState((state) => ({ count: state.count + 1 }));
console.log(store.getState().count); // → 43
