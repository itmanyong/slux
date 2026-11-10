import { createStore } from "@slux/store";
import { broadcast } from "@slux/tab-sync";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;
type Log = (message: string, tone?: LogTone) => void;
type State = { count: number };

const CHANNEL = "slux-demo-pair";

export function createPairSyncDemo(log: Log): DemoInstance {
  const supported = typeof BroadcastChannel === "function";
  let notify: (() => void) | undefined;

  const makeStore = (name: string) => {
    const store = createStore<State>(() => ({ count: 0 }), {
      middleware: [broadcast<State>({ channel: CHANNEL })],
    });
    const stop = store.subscribe((state) => {
      log(`${name}:count=${String(state.count)}`, "notify");
      notify?.();
    });
    return { store, stop };
  };

  const a = makeStore("A");
  const b = makeStore("B");
  log(
    supported
      ? `BroadcastChannel 可用：A 与 B 挂在通道「${CHANNEL}」上，互相可见`
      : "当前环境缺少 BroadcastChannel：中间件不会建立连接，A 与 B 各自独立",
    supported ? "info" : "error",
  );

  return {
    readouts: [
      {
        kind: "metric",
        label: "A.count",
        emphasis: true,
        read: () => String(a.store.getState().count),
      },
      {
        kind: "metric",
        label: "B.count",
        emphasis: true,
        read: () => String(b.store.getState().count),
      },
      {
        kind: "text",
        label: "通道状态",
        read: () => (supported ? `「${CHANNEL}」已连接` : "BroadcastChannel 不可用"),
      },
    ],
    actions: [
      {
        id: "a-inc",
        label: "A + 1",
        primary: true,
        run: () => {
          a.store.setState((state) => ({ count: state.count + 1 }));
        },
      },
      {
        id: "b-inc",
        label: "B + 1",
        run: () => {
          b.store.setState((state) => ({ count: state.count + 1 }));
        },
      },
    ],
    subscribe: (listener) => {
      notify = listener;
      return () => {
        notify = undefined;
      };
    },
    dispose: () => {
      a.stop();
      b.stop();
      a.store.destroy();
      b.store.destroy();
    },
  };
}
