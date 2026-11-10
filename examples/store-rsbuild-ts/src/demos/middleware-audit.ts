import { createStore, type Middleware } from "@slux/store";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** Middleware.onSet：写入前审计 partial，再放行给 next。 */
export function createMiddlewareAuditDemo(log: Log): DemoInstance {
  let audits = 0;
  let lastPartial = "（还没有写入）";
  const audit: Middleware<{ count: number }> = {
    name: "audit",
    onSet(_api, next, partial) {
      audits += 1;
      lastPartial = JSON.stringify(partial);
      log(`audit #${audits}: 捕获 partial ${lastPartial}`, "scope");
      next(partial);
    },
  };
  const store = createStore<{ count: number }>(() => ({ count: 0 }), {
    middleware: [audit],
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => String(store.getState().count),
      },
      { kind: "metric", label: "audit 次数", read: () => String(audits) },
      { kind: "text", label: "最近 partial", read: () => lastPartial },
    ],
    actions: [
      {
        id: "write",
        label: "updater +N",
        primary: true,
        input: { kind: "number", placeholder: "步长", value: "1" },
        run(input) {
          const step = Number(input) || 0;
          store.setState((state) => ({ count: state.count + step }));
          log(`setState +${step} → ${store.getState().count}`, "write");
        },
      },
      {
        id: "reset",
        label: "归零",
        run() {
          store.setState({ count: 0 });
          log("setState({ count: 0 }) → 0", "write");
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
