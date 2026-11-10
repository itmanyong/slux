import { createStore } from "@slux/store";

const store = createStore<{ todos: string[] }>(() => ({ todos: [] }));

const unsubscribe = store.subscribe((state, prevState) => {
  console.log(prevState.todos.length, "→", state.todos.length);
});

store.setState((state) => ({ todos: [...state.todos, "first"] })); // → 0 → 1
unsubscribe();
store.setState((state) => ({ todos: [...state.todos, "second"] })); // 无输出
