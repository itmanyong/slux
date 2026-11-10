import { createStore } from "@slux/store";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** destroy：销毁后 setState 与 subscribe 全部失效，重复 destroy 是 no-op。 */
export function createLifecycleDestroyDemo(log: Log): DemoInstance {
  const store = createStore<{ count: number }>(() => ({ count: 0 }));
  let destroyed = false;
  let ignored = 0;

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => String(store.getState().count),
      },
      {
        kind: "text",
        label: "状态",
        read: () => (destroyed ? "destroyed" : "alive"),
      },
      { kind: "metric", label: "被忽略的写入", read: () => String(ignored) },
    ],
    actions: [
      {
        id: "write",
        label: "+1 写入",
        primary: true,
        run() {
          store.setState((state) => ({ count: state.count + 1 }));
          log(`setState +1 → ${store.getState().count}`, "write");
        },
      },
      {
        id: "destroy",
        label: "destroy()",
        run() {
          if (destroyed) {
            log("已经 destroy，重复调用是 no-op", "info");
            return;
          }
          store.destroy();
          destroyed = true;
          log("store.destroy() → listeners 清空、中间件执行 onDestroy", "notify");
        },
      },
      {
        id: "after",
        label: "destroy 后写入",
        run() {
          if (!destroyed) {
            store.setState((state) => ({ count: state.count + 1 }));
            log(`尚未销毁，正常写入 → ${store.getState().count}`, "write");
            return;
          }
          ignored += 1;
          store.setState({ count: 999 });
          log(`setState(999) 被忽略（第 ${ignored} 次）`, "error");
        },
      },
    ],
  };
}
