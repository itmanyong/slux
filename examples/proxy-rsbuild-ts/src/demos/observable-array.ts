import type { ExampleDemo } from "@slux/shell-example";
import { observable, subscribe } from "@slux/proxy";

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const todos = observable<{ text: string; done: boolean }[]>([{ text: "learn proxy", done: false }]);
  const listeners = new Set<() => void>();
  const stop = subscribe(todos, () => {
    context.log(`subscribe → length: ${todos.length}`, "notify");
    for (const listener of listeners) listener();
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "length",
        emphasis: true,
        read: () => String(todos.length),
      },
      {
        kind: "list",
        label: "todos",
        read: () => todos.map((todo, index) => `${index}. ${todo.done ? "✓" : "•"} ${todo.text}`),
      },
    ],
    actions: [
      {
        id: "push",
        label: "push",
        primary: true,
        input: { kind: "text", placeholder: "新条目内容", value: "build demo" },
        run: (input) => {
          const text = input.trim();
          if (!text) {
            context.log("内容不能为空，push 被跳过", "error");
            return;
          }
          todos.push({ text, done: false });
          context.log(`todos.push({ text: "${text}", done: false })`, "write");
        },
      },
      {
        id: "toggle-first",
        label: "toggle 第一项",
        run: () => {
          const first = todos[0];
          if (!first) {
            context.log("数组为空，toggle 被跳过", "info");
            return;
          }
          first.done = !first.done;
          context.log(`todos[0].done = ${first.done} — 子代理写入沿父链传播`, "write");
        },
      },
      {
        id: "truncate",
        label: "length 截断",
        run: () => {
          if (todos.length === 0) {
            context.log("数组已为空", "info");
            return;
          }
          todos.length = todos.length - 1;
          context.log(`todos.length = ${todos.length} — 截断更新被移除索引的依赖`, "write");
        },
      },
    ],
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      stop();
    },
  };
};
