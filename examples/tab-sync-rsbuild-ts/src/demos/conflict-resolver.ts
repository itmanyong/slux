import { createStore } from "@slux/store";
import { broadcast } from "@slux/tab-sync";
import type { ConflictResolver } from "@slux/tab-sync";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;
type Log = (message: string, tone?: LogTone) => void;
type State = { count: number };

const CHANNEL = "slux-demo-resolver";

const keepHighest: ConflictResolver<State> = (incoming, current) => ({
  count: Math.max(incoming.count ?? 0, current.count),
});

export function createConflictResolverDemo(log: Log): DemoInstance {
  const supported = typeof BroadcastChannel === "function";
  let notify: (() => void) | undefined;

  const writer = createStore<State>(() => ({ count: 0 }), {
    middleware: [broadcast<State>({ channel: CHANNEL })],
  });
  const holder = createStore<State>(() => ({ count: 10 }), {
    middleware: [broadcast<State>({ channel: CHANNEL, conflictResolution: keepHighest })],
  });

  const stopWriter = writer.subscribe(() => notify?.());
  const stopHolder = holder.subscribe((state) => {
    log(`holder 应用远端后：count=${String(state.count)}（取两者较大值）`, "notify");
    notify?.();
  });

  log(
    supported
      ? `holder 的冲突策略是 keepHighest：writer 发来的较小值会被合并掉（通道「${CHANNEL}」）`
      : "当前环境缺少 BroadcastChannel：同步行为不可见",
    supported ? "info" : "error",
  );

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
        label: "holder.count",
        emphasis: true,
        read: () => String(holder.getState().count),
      },
      {
        kind: "text",
        label: "冲突策略",
        read: () => "keepHighest（取较大值）",
      },
    ],
    actions: [
      {
        id: "small",
        label: "writer: + 1",
        primary: true,
        title: "发一个小值，holder 会保持 10",
        run: () => {
          writer.setState((state) => ({ count: state.count + 1 }));
        },
      },
      {
        id: "big",
        label: "writer: + 25",
        run: () => {
          writer.setState((state) => ({ count: state.count + 25 }));
          log("这次发来的值比 holder 大，合并后被接受", "info");
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
      stopWriter();
      stopHolder();
      writer.destroy();
      holder.destroy();
    },
  };
}
