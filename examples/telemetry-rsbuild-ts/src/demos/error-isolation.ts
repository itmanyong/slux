import { createStore } from "@slux/store";
import { telemetry } from "@slux/telemetry";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;
type State = { count: number };

export function createErrorIsolationDemo(log: Log): DemoInstance {
  let poisoned = false;
  let reported = 0;
  let errorCount = 0;
  let lastError = "—";

  const metrics = telemetry<State>({
    onStateChange: (meta) => {
      if (poisoned) throw new Error("上报通道已投毒");
      reported += 1;
      log(`上报 #${meta.changeCount}：count=${String(meta.nextState.count)}`, "notify");
    },
    onError: (context) => {
      errorCount += 1;
      lastError = `${context.source}: ${String(context.error)}`;
      log(`onError 捕获 ${context.source}，业务更新不受影响`, "error");
    },
  });

  const store = createStore<State>(() => ({ count: 0 }), {
    middleware: [metrics],
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "count",
        emphasis: true,
        read: () => String(store.getState().count),
      },
      { kind: "metric", label: "上报成功", read: () => String(reported) },
      { kind: "metric", label: "捕获错误", read: () => String(errorCount) },
      { kind: "text", label: "最近错误", read: () => lastError },
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
        id: "poison",
        label: "投毒",
        title: "让 onStateChange 回调抛出异常",
        run: () => {
          poisoned = true;
          log("已投毒：下次上报会抛错，交给 onError", "info");
        },
      },
      {
        id: "cure",
        label: "解毒",
        run: () => {
          poisoned = false;
          log("已解毒：上报恢复正常", "info");
        },
      },
    ],
    dispose: () => {
      store.destroy();
    },
  };
}
