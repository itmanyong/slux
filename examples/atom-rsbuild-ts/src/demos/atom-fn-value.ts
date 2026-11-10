import type { ExampleDemo } from "@slux/shell-example";
import { atom } from "@slux/atom";

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const callback = atom<(() => number) | undefined>(undefined);
  const answer = () => 42;

  return {
    readouts: [
      {
        kind: "text",
        label: "typeof get()",
        read: () => String(typeof callback.get()),
      },
      {
        kind: "text",
        label: "调用结果",
        read: () => {
          const value = callback.get();
          return typeof value === "function" ? String(value()) : "—";
        },
      },
    ],
    actions: [
      {
        id: "store-fn",
        label: "set 存入函数",
        primary: true,
        run: () => {
          callback.set(answer);
          context.log("callback.set(answer) — 函数本身被保存，不会执行", "write");
        },
      },
      {
        id: "call",
        label: "调用 get()()",
        run: () => {
          const value = callback.get();
          context.log(typeof value === "function" ? `get()() → ${value()}` : "还没有函数，先点「存入函数」", "info");
        },
      },
    ],
  };
};
