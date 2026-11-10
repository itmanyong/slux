import { createStore } from "@slux/store";
import { broadcast } from "@slux/tab-sync";
import type { BroadcastMessage } from "@slux/tab-sync";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;
type Log = (message: string, tone?: LogTone) => void;
type State = { count: number };

const CHANNEL = "slux-demo-wire";
const MAX_MESSAGES = 40;

export function createWireInspectorDemo(log: Log): DemoInstance {
  const supported = typeof BroadcastChannel === "function";
  const messages: string[] = [];
  let eavesdrop: BroadcastChannel | undefined;
  let notify: (() => void) | undefined;

  const store = createStore<State>(() => ({ count: 0 }), {
    middleware: [broadcast<State>({ channel: CHANNEL })],
  });
  const stopStore = store.subscribe(() => notify?.());

  if (supported) {
    eavesdrop = new BroadcastChannel(CHANNEL);
    eavesdrop.onmessage = (event: MessageEvent) => {
      const message = event.data as BroadcastMessage<State>;
      const text = `state=${JSON.stringify(message.state)} · ts=${String(message.timestamp)} · from=${message.senderId.slice(0, 8)}`;
      messages.push(text);
      if (messages.length > MAX_MESSAGES) messages.shift();
      log(`线上消息 ${text}`, "notify");
      notify?.();
    };
    log(`窃听器已挂上通道「${CHANNEL}」：store 每次本地写入都会在这里现出原形`, "info");
  } else {
    log("当前环境缺少 BroadcastChannel：无法观察线上消息", "error");
  }

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => String(store.getState().count),
      },
      {
        kind: "list",
        label: "线上消息（BroadcastMessage）",
        read: () => messages.slice(-4),
      },
      {
        kind: "text",
        label: "通道状态",
        read: () => (supported ? `「${CHANNEL}」监听中` : "BroadcastChannel 不可用"),
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
        id: "clear",
        label: "清空记录",
        run: () => {
          messages.length = 0;
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
      eavesdrop?.close();
      stopStore();
      store.destroy();
    },
  };
}
