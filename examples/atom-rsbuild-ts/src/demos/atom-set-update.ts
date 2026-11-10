import type { ExampleDemo } from "@slux/shell-example";
import { atom } from "@slux/atom";

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const count = atom(0);
  const listeners = new Set<() => void>();
  const stop = count.subscribe((value) => {
    context.log(`subscribe → count: ${value}`, "notify");
    for (const listener of listeners) listener();
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => String(count.get()),
      },
    ],
    actions: [
      {
        id: "update",
        label: "update + 1",
        run: () => {
          count.update((value) => value + 1);
          context.log("count.update((value) => value + 1)", "write");
        },
      },
      {
        id: "set",
        label: "set 设值",
        input: { kind: "number", placeholder: "count 的新值", value: "10" },
        run: (input) => {
          const next = Number(input);
          if (Number.isNaN(next)) {
            context.log(`"${input}" 不是数字，set 被跳过`, "error");
            return;
          }
          count.set(next);
          context.log(`count.set(${next}) — 整体替换`, "write");
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
