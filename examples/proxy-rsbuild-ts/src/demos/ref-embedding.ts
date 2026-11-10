import type { ExampleDemo } from "@slux/shell-example";
import { observable, ref, subscribe } from "@slux/proxy";

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const initialMap = new Map<string, number>([["latency", 42]]);
  const state = observable({ connection: ref(initialMap) });
  let notified = 0;
  const listeners = new Set<() => void>();
  const stop = subscribe(state, () => {
    notified += 1;
    context.log("subscribe → 状态变更（ref 替换）", "notify");
    for (const listener of listeners) listener();
  });

  return {
    readouts: [
      {
        kind: "metric",
        label: "订阅通知次数",
        emphasis: true,
        read: () => String(notified),
      },
      {
        kind: "text",
        label: "connection 内容",
        read: () => [...state.connection.current].map(([key, value]) => `${key}=${value}`).join(", ") || "空",
      },
      {
        kind: "text",
        label: "Map 引用",
        read: () => (state.connection.current === initialMap ? "相同（原引用保留）" : "已替换"),
      },
    ],
    actions: [
      {
        id: "mutate-ref",
        label: "改 ref.current（不通知）",
        run: () => {
          const map = state.connection.current;
          map.set("latency", (map.get("latency") ?? 0) + 1);
          context.log(`connection.current.set → latency=${map.get("latency")}（ref 内部修改不触发通知）`, "write");
        },
      },
      {
        id: "replace-ref",
        label: "替换 ref（通知）",
        primary: true,
        run: () => {
          state.connection = ref(new Map<string, number>([["latency", 7]]));
          context.log("state.connection = ref(new Map()) — 替换属性，发布通知", "write");
        },
      },
    ],
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      stop();
    },
  };
};
