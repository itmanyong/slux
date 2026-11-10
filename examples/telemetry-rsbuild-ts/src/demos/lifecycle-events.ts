import { createStore } from "@slux/store";
import { telemetry } from "@slux/telemetry";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;
type State = { count: number };

export function createLifecycleDemo(log: Log): DemoInstance {
  let totalSubs = 0;
  let active = 0;
  let initEvent = "—";
  const unsubs: (() => void)[] = [];

  const metrics = telemetry<State>({
    onInit: (state, meta) => {
      initEvent = `${JSON.stringify(state)} @ ${meta.timestamp}`;
      log(`onInit：初始状态 ${JSON.stringify(state)}`, "info");
    },
    onSubscribe: (meta) => {
      totalSubs = meta.totalSubscriptions;
      log(`onSubscribe：累计第 ${meta.totalSubscriptions} 次订阅`, "scope");
    },
  });

  const store = createStore<State>(() => ({ count: 0 }), {
    middleware: [metrics],
  });

  return {
    readouts: [
      { kind: "metric", label: "累计订阅", read: () => String(totalSubs) },
      { kind: "metric", label: "活跃订阅", read: () => String(active) },
      { kind: "text", label: "onInit 事件", read: () => initEvent },
    ],
    actions: [
      {
        id: "subscribe",
        label: "添加订阅",
        primary: true,
        run: () => {
          unsubs.push(store.subscribe(() => {}));
          active += 1;
        },
      },
      {
        id: "unsubscribe",
        label: "取消最早订阅",
        title: "取消不影响 totalSubscriptions：它是累计次数，不是活跃数",
        run: () => {
          const stop = unsubs.shift();
          if (stop === undefined) {
            log("没有可取消的订阅", "error");
            return;
          }
          stop();
          active -= 1;
          log("已取消订阅，totalSubscriptions 不回退", "info");
        },
      },
    ],
    dispose: () => {
      for (const stop of unsubs.splice(0)) stop();
      store.destroy();
    },
  };
}
