import { createMachine } from "@slux/state-machine";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface CartContext {
  items: string[];
}

type CartEvent = { type: "ADD"; name: string } | { type: "REMOVE"; name: string } | { type: "CLEAR" };

type CartState = "open";

/** 购物车：action 链式更新 context，context 必须以不可变方式替换。 */
export function createCart({ log }: { log: Log }) {
  const machine = createMachine<CartContext, CartEvent, CartState>({
    initial: "open",
    context: { items: [] },
    states: {
      open: {
        on: {
          ADD: {
            actions: [
              (context, event) => ({
                items: [...context.items, event.name],
              }),
            ],
          },
          REMOVE: {
            actions: [
              (context, event) => {
                const index = context.items.lastIndexOf(event.name);
                if (index < 0) return undefined;
                return {
                  items: [...context.items.slice(0, index), ...context.items.slice(index + 1)],
                };
              },
            ],
          },
          CLEAR: {
            actions: [() => ({ items: [] })],
          },
        },
      },
    },
  });

  log("action 返回新 context：items 永远整体替换", "info");

  return {
    readouts: [
      {
        kind: "metric" as const,
        label: "count",
        emphasis: true,
        read: () => String(machine.get().context.items.length),
      },
      {
        kind: "list" as const,
        label: "items",
        read: () => machine.get().context.items,
      },
    ],
    actions: [
      {
        id: "add",
        label: "ADD",
        primary: true,
        input: {
          kind: "text" as const,
          placeholder: "商品名，加入购物车",
          value: "",
        },
        run: (name: string) => {
          if (!name.trim()) {
            log("ADD 需要输入商品名", "error");
            return;
          }
          machine.send({ type: "ADD", name: name.trim() });
          log(`ADD ${name.trim()} → ${machine.get().context.items.length} 件`, "write");
        },
      },
      {
        id: "remove",
        label: "REMOVE",
        input: {
          kind: "text" as const,
          placeholder: "商品名，移除最后一件同名",
          value: "",
        },
        run: (name: string) => {
          const target = name.trim();
          if (!machine.get().context.items.includes(target)) {
            log(`REMOVE ${target || "（空）"} → 购物车中没有该商品`, "error");
            return;
          }
          machine.send({ type: "REMOVE", name: target });
          log(`REMOVE ${target} → ${machine.get().context.items.length} 件`, "write");
        },
      },
      {
        id: "clear",
        label: "CLEAR",
        run: () => {
          machine.send({ type: "CLEAR" });
          log("CLEAR → 购物车已清空", "write");
        },
      },
    ],
    dispose: () => machine.destroy(),
  };
}
