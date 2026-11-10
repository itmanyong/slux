import type { ExampleDemo } from "@slux/shell-example";
import { atom, writableAtom } from "@slux/atom";

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const history = atom<string[]>([]);
  const append = writableAtom(null, (get, set, item: string) => {
    set(history, [...get(history), item]);
    return get(history).length;
  });
  const clear = writableAtom(null, (_get, set) => {
    set(history, []);
  });
  const listeners = new Set<() => void>();
  const stop = history.subscribe((value) => {
    context.log(`history → [${value.map((item) => `"${item}"`).join(", ")}]`, "notify");
    for (const listener of listeners) listener();
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "条数",
        emphasis: true,
        read: () => String(history.get().length),
      },
      {
        kind: "list",
        label: "history",
        read: () => history.get().map((item, index) => `${index + 1}. ${item}`),
      },
    ],
    actions: [
      {
        id: "append",
        label: "append",
        primary: true,
        input: { kind: "text", placeholder: "要追加的条目", value: "first" },
        run: (input) => {
          const item = input.trim();
          if (!item) {
            context.log("条目不能为空，write 被跳过", "error");
            return;
          }
          const length = append.write(item);
          context.log(`append.write("${item}") → 长度 ${length}`, "write");
        },
      },
      {
        id: "clear",
        label: "clear",
        run: () => {
          clear.write();
          context.log("clear.write() — read 为 null 的只写原子", "write");
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
