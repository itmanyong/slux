import { createStore } from "@slux/store";
import { telemetry } from "@slux/telemetry";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;
type State = { count: number };

export function createRebuildStoreDemo(log: Log): DemoInstance {
  let lastChangeCount = 0;
  let destroyed = false;

  const metrics = telemetry<State>({
    onStateChange: (meta) => {
      lastChangeCount = meta.changeCount;
      log(`上报 #${meta.changeCount}：count=${String(meta.nextState.count)}`, "notify");
    },
  });

  let store = createStore<State>(() => ({ count: 0 }), {
    middleware: [metrics],
  });
  const mount = (): void => {
    store = createStore<State>(() => ({ count: 0 }), { middleware: [metrics] });
    destroyed = false;
  };

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => (destroyed ? "—" : String(store.getState().count)),
      },
      {
        kind: "metric",
        label: "changeCount",
        read: () => String(lastChangeCount),
      },
      {
        kind: "text",
        label: "实例状态",
        read: () => (destroyed ? "已销毁" : "运行中"),
      },
    ],
    actions: [
      {
        id: "inc",
        label: "+ 1",
        primary: true,
        run: () => {
          if (destroyed) {
            log("Store 已销毁，setState 无效", "error");
            return;
          }
          store.setState((state) => ({ count: state.count + 1 }));
        },
      },
      {
        id: "destroy",
        label: "销毁 Store",
        title: "onDestroy 把 changeCount 与 totalSubscriptions 归零",
        run: () => {
          if (destroyed) {
            log("已经是销毁状态", "info");
            return;
          }
          store.destroy();
          destroyed = true;
          lastChangeCount = 0;
          log("onDestroy：计数已归零，中间件实例仍在", "scope");
        },
      },
      {
        id: "rebuild",
        label: "重建 Store",
        title: "同一个中间件实例接入新 Store，计数从 1 重新开始",
        run: () => {
          if (!destroyed) {
            log("先把当前 Store 销毁，再重建才有对比意义", "info");
            return;
          }
          mount();
          log("新 Store 已接入同一个 metrics 实例", "info");
        },
      },
    ],
    dispose: () => {
      if (!destroyed) store.destroy();
    },
  };
}
