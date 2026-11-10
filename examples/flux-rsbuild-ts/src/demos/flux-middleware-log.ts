import type { ExampleDemo } from "@slux/shell-example";
import { createFluxStore, type FluxMiddleware } from "@slux/flux";

type Action = { type: "add"; amount: number } | { type: "reset" };

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const events: string[] = [];
  const record = (text: string) => {
    events.push(text);
    if (events.length > 6) events.shift();
  };

  const logger =
    (name: string): FluxMiddleware<number, Action> =>
    (api) =>
    (next) =>
    (action) => {
      const before = api.getState();
      context.log(`[${name}] before · getState()=${before} · ${action.type}`, "info");
      record(`${name} before · state=${before}`);
      const returned = next(action);
      const after = api.getState();
      context.log(`[${name}] after · getState()=${after}`, "info");
      record(`${name} after · state=${after}`);
      return returned;
    };

  const store = createFluxStore((state: number, action: Action) => (action.type === "add" ? state + action.amount : 0), 0, {
    middleware: [logger("A"), logger("B")],
  });
  const listeners = new Set<() => void>();
  const stop = store.subscribe((state) => {
    context.log(`subscribe → value: ${state}`, "notify");
    for (const listener of listeners) listener();
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "value",
        emphasis: true,
        read: () => String(store.get()),
      },
      {
        kind: "list",
        label: "中间件事件（数组第一项在最外层）",
        read: () => [...events],
      },
    ],
    actions: [
      {
        id: "dispatch",
        label: "dispatch add",
        primary: true,
        input: { kind: "number", placeholder: "amount", value: "1" },
        run: (input) => {
          const amount = Number(input);
          if (Number.isNaN(amount)) {
            context.log(`"${input}" 不是数字，dispatch 被跳过`, "error");
            return;
          }
          store.dispatch({ type: "add", amount });
          context.log(`dispatch({ type: "add", amount: ${amount} }) — 观察日志中的 A→B 顺序`, "write");
        },
      },
      {
        id: "reset",
        label: "dispatch reset",
        run: () => {
          store.dispatch({ type: "reset" });
          context.log('dispatch({ type: "reset" })', "write");
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
      store.destroy();
    },
  };
};
