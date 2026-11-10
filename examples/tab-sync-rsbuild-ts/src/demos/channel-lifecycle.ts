import { createStore } from "@slux/store";
import { broadcast } from "@slux/tab-sync";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;
type Log = (message: string, tone?: LogTone) => void;
type State = { count: number };

const CHANNEL = "slux-demo-lifecycle";

export function createChannelLifecycleDemo(log: Log): DemoInstance {
  const supported = typeof BroadcastChannel === "function";
  let notify: (() => void) | undefined;
  let viewer: ReturnType<typeof mountViewer> | undefined;

  const mountViewer = () => {
    const store = createStore<State>(() => ({ count: 0 }), {
      middleware: [broadcast<State>({ channel: CHANNEL })],
    });
    const stop = store.subscribe((state) => {
      log(`viewer 收到同步：count=${String(state.count)}`, "notify");
      notify?.();
    });
    return { store, stop };
  };

  const writer = createStore<State>(() => ({ count: 0 }), {
    middleware: [broadcast<State>({ channel: CHANNEL })],
  });
  viewer = mountViewer();
  log(
    supported
      ? `writer 与 viewer 挂在通道「${CHANNEL}」上；销毁 viewer 后它将掉线，重建后重新加入`
      : "当前环境缺少 BroadcastChannel：同步行为不可见",
    supported ? "info" : "error",
  );

  let viewerDown = false;

  return {
    readouts: [
      {
        kind: "metric",
        label: "writer.count",
        emphasis: true,
        read: () => String(writer.getState().count),
      },
      {
        kind: "metric",
        label: "viewer.count",
        emphasis: true,
        read: () => (viewerDown || viewer === undefined ? "—" : String(viewer.store.getState().count)),
      },
      {
        kind: "text",
        label: "viewer 状态",
        read: () => (viewerDown ? "已掉线（通道已关闭）" : "在线"),
      },
    ],
    actions: [
      {
        id: "write",
        label: "writer: + 1",
        primary: true,
        run: () => {
          writer.setState((state) => ({ count: state.count + 1 }));
          if (viewerDown) log("viewer 已掉线：广播发出去但没人接收", "info");
        },
      },
      {
        id: "destroy",
        label: "销毁 viewer",
        title: "onDestroy 会 close 掉 BroadcastChannel",
        run: () => {
          if (viewerDown || viewer === undefined) {
            log("viewer 已经掉线", "info");
            return;
          }
          viewer.stop();
          viewer.store.destroy();
          viewerDown = true;
          log("viewer 已销毁：channel.close()，不再接收广播", "scope");
        },
      },
      {
        id: "rebuild",
        label: "重建 viewer",
        run: () => {
          if (!viewerDown) {
            log("viewer 还在线，先销毁再重建", "info");
            return;
          }
          viewer = mountViewer();
          viewerDown = false;
          log("viewer 重新加入通道，从 writer 的下一笔广播开始跟随", "info");
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
      viewer?.stop();
      viewer?.store.destroy();
      writer.destroy();
    },
  };
}
