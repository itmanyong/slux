import { createStore, type Middleware } from "@slux/store";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** Middleware 链：外层 logger 先收到 onSet，内层 guard 决定是否放行。 */
export function createMiddlewareGuardDemo(log: Log): DemoInstance {
  let blocked = 0;
  const guard: Middleware<{ count: number }> = {
    name: "guard",
    onSet(api, next, partial) {
      const candidate = partial.count ?? api.getState().count;
      if (candidate < 0) {
        blocked += 1;
        log(`guard 拦截：候选值 ${candidate} < 0，未调用 next`, "error");
        return;
      }
      next(partial);
    },
  };
  const logger: Middleware<{ count: number }> = {
    name: "logger",
    onSet(_api, next, partial) {
      log(`logger → 转发 partial ${JSON.stringify(partial)}`, "scope");
      next(partial);
    },
  };
  const store = createStore<{ count: number }>(() => ({ count: 0 }), {
    middleware: [logger, guard],
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => String(store.getState().count),
      },
      { kind: "metric", label: "拦截次数", read: () => String(blocked) },
      { kind: "text", label: "规则", read: () => "count ≥ 0 才放行" },
    ],
    actions: [
      {
        id: "write",
        label: "updater +N（可为负）",
        primary: true,
        input: { kind: "number", placeholder: "步长（如 -5）", value: "1" },
        run(input) {
          const step = Number(input) || 0;
          store.setState((state) => ({ count: state.count + step }));
          log(`setState +${step} → ${store.getState().count}`, "write");
        },
      },
    ],
    subscribe(listener) {
      return store.subscribe(() => listener());
    },
    dispose() {
      store.destroy();
    },
  };
}
