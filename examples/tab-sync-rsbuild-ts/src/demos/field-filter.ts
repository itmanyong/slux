import { createStore } from "@slux/store";
import { broadcast } from "@slux/tab-sync";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;
type Log = (message: string, tone?: LogTone) => void;
type State = { count: number; noise: number };

const CHANNEL = "slux-demo-filter";

export function createFieldFilterDemo(log: Log): DemoInstance {
  const supported = typeof BroadcastChannel === "function";
  let notify: (() => void) | undefined;

  const editor = createStore<State>(() => ({ count: 0, noise: 0 }), {
    middleware: [
      broadcast<State>({
        channel: CHANNEL,
        filter: (state) => ({ count: state.count }),
      }),
    ],
  });
  const viewer = createStore<State>(() => ({ count: 0, noise: 0 }), {
    middleware: [broadcast<State>({ channel: CHANNEL })],
  });

  const stopEditor = editor.subscribe(() => notify?.());
  const stopViewer = viewer.subscribe((state) => {
    log(`viewer 收到：count=${String(state.count)}，noise 保持本地值`, "notify");
    notify?.();
  });

  log(
    supported
      ? `editor 的广播经 filter 折叠成 { count }，noise 永远不出本页（通道「${CHANNEL}」）`
      : "当前环境缺少 BroadcastChannel：同步行为不可见",
    supported ? "info" : "error",
  );

  return {
    readouts: [
      {
        kind: "metric",
        label: "editor.count",
        emphasis: true,
        read: () => String(editor.getState().count),
      },
      {
        kind: "metric",
        label: "editor.noise",
        read: () => String(editor.getState().noise),
      },
      {
        kind: "metric",
        label: "viewer.count",
        emphasis: true,
        read: () => String(viewer.getState().count),
      },
      {
        kind: "metric",
        label: "viewer.noise",
        read: () => String(viewer.getState().noise),
      },
    ],
    actions: [
      {
        id: "count",
        label: "editor: count + 1",
        primary: true,
        run: () => {
          editor.setState((state) => ({ count: state.count + 1 }));
        },
      },
      {
        id: "noise",
        label: "editor: noise + 1",
        run: () => {
          editor.setState((state) => ({ noise: state.noise + 1 }));
          log("noise 是本地草稿：广播里只含 count，viewer 的 noise 不动", "info");
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
      stopEditor();
      stopViewer();
      editor.destroy();
      viewer.destroy();
    },
  };
}
