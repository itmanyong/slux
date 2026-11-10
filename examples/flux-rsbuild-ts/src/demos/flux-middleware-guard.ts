import type { ExampleDemo } from "@slux/shell-example";
import { createFluxStore, type FluxMiddleware } from "@slux/flux";

type Action = { type: "add"; amount: number };

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const events: string[] = [];
  const record = (text: string) => {
    events.push(text);
    if (events.length > 6) events.shift();
  };

  const blockNegative: FluxMiddleware<number, Action> = () => (next) => (action) => {
    if (action.amount < 0) {
      record("阻断未调用 next");
      context.log(`[guard] 阻断 add ${action.amount}（未调用 next，状态不变）`, "error");
      return action;
    }
    return next(action);
  };
  const double: FluxMiddleware<number, Action> = () => (next) => (action) => {
    const rewritten = { ...action, amount: action.amount * 2 };
    record(`改写 ${action.amount} → ${rewritten.amount}`);
    context.log(`[double] 改写 amount ${action.amount} → ${rewritten.amount}`, "info");
    return next(rewritten);
  };

  const store = createFluxStore((state: number, action: Action) => state + action.amount, 10, {
    middleware: [blockNegative, double],
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
        label: "中间件事件",
        read: () => [...events],
      },
    ],
    actions: [
      {
        id: "dispatch",
        label: "dispatch（正数被翻倍）",
        primary: true,
        input: { kind: "number", placeholder: "amount", value: "3" },
        run: (input) => {
          const amount = Number(input);
          if (Number.isNaN(amount)) {
            context.log(`"${input}" 不是数字，dispatch 被跳过`, "error");
            return;
          }
          const returned = store.dispatch({ type: "add", amount });
          context.log(`dispatch 返回 ${JSON.stringify(returned)}`, "write");
        },
      },
      {
        id: "block",
        label: "dispatch −5（被阻断）",
        run: () => {
          const returned = store.dispatch({ type: "add", amount: -5 });
          context.log(`dispatch 返回 ${JSON.stringify(returned)}（原样返回，未提交）`, "write");
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
