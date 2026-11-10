import { createStore } from "@slux/store";
import { logger } from "@slux/devtools";
import type { LoggerInterface } from "@slux/devtools";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;
type Log = (message: string, tone?: LogTone) => void;
type State = { count: number; label: string };

const MAX_LINES = 40;

const format = (args: unknown[]): string => args.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg))).join(" ");

export function createLoggerBasicDemo(log: Log): DemoInstance {
  const lines: string[] = [];
  const push = (text: string, tone: LogTone = "info") => {
    lines.push(text);
    if (lines.length > MAX_LINES) lines.shift();
    log(text, tone);
  };

  const capture: LoggerInterface = {
    log: (...args) => push(format(args)),
    group: (...args) => push(`◇ ${format(args)}`, "scope"),
    groupCollapsed: (...args) => push(`▸ ${format(args)}`, "scope"),
    groupEnd: () => {},
  };

  const store = createStore<State>(() => ({ count: 0, label: "cart" }), {
    middleware: [logger<State>({ name: "Demo", collapsed: false, logger: capture })],
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => String(store.getState().count),
      },
      { kind: "text", label: "label", read: () => store.getState().label },
      {
        kind: "list",
        label: "控制台输出",
        read: () => lines.slice(-6),
      },
    ],
    actions: [
      {
        id: "inc",
        label: "+ 1",
        primary: true,
        run: () => {
          store.setState((state) => ({ count: state.count + 1 }));
        },
      },
      {
        id: "rename",
        label: "改 label",
        run: () => {
          store.setState({ label: `cart-${store.getState().count}` });
        },
      },
    ],
    dispose: () => {
      store.destroy();
    },
  };
}
