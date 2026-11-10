import { createStore } from "@slux/store";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** subscribe：监听 (state, prevState)，退订后写入不再产生通知。 */
export function createStoreSubscribeDemo(log: Log): DemoInstance {
  const store = createStore<{ todos: string[] }>(() => ({
    todos: ["读 SPEC"],
  }));
  let notified = 0;
  const unsubscribe = store.subscribe((state, prevState) => {
    notified += 1;
    log(`listener #${notified}: ${prevState.todos.length} 项 → ${state.todos.length} 项`, "notify");
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "通知次数",
        emphasis: true,
        read: () => String(notified),
      },
      { kind: "list", label: "todos", read: () => store.getState().todos },
    ],
    actions: [
      {
        id: "add",
        label: "添加 todo",
        primary: true,
        input: { kind: "text", placeholder: "内容", value: "写测试" },
        run(input) {
          const text = input.trim();
          if (!text) {
            log("输入为空，未写入", "error");
            return;
          }
          store.setState((state) => ({ todos: [...state.todos, text] }));
          log(`setState 追加 "${text}"`, "write");
        },
      },
      {
        id: "pop",
        label: "移除最后一项",
        run() {
          const todos = store.getState().todos;
          const last = todos[todos.length - 1];
          if (last === undefined) {
            log("列表已空，无可移除项", "error");
            return;
          }
          store.setState({ todos: todos.slice(0, -1) });
          log(`setState 移除 "${last}"`, "write");
        },
      },
      {
        id: "unsubscribe",
        label: "退订 listener",
        run() {
          unsubscribe();
          log("已退订，后续写入不再通知该 listener", "info");
        },
      },
    ],
    subscribe(listener) {
      return store.subscribe(() => listener());
    },
    dispose() {
      unsubscribe();
    },
  };
}
