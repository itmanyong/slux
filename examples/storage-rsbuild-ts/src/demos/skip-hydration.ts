import { createStore } from "@slux/store";
import { persist, memoryStorage } from "@slux/storage";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** skipHydration：跳过 init 时的自动水合，由调用方决定何时 rehydrate()。 */
export function createSkipHydrationDemo(log: Log): DemoInstance {
  const storage = memoryStorage();
  const key = "persist:defer";
  storage.setItem(key, JSON.stringify({ state: { theme: "dark" }, version: 0 }));

  const persistMiddleware = persist<{ theme: string }>({
    key,
    storage,
    skipHydration: true,
  });
  const store = createStore<{ theme: string }>(() => ({ theme: "light" }), {
    middleware: [persistMiddleware],
  });
  log("init → skipHydration=true，落盘数据未被读入", "info");

  const envelope = (): string => {
    const raw = storage.getItem(key);
    return typeof raw === "string" ? raw : "null";
  };

  return {
    readouts: [
      {
        kind: "metric",
        label: "hasHydrated()",
        emphasis: true,
        read: () => String(persistMiddleware.hasHydrated()),
      },
      {
        kind: "text",
        label: "当前 theme",
        read: () => store.getState().theme,
      },
      {
        kind: "text",
        label: "落盘 envelope",
        read: envelope,
      },
    ],
    actions: [
      {
        id: "rehydrate",
        label: "rehydrate()",
        primary: true,
        run() {
          log("rehydrate() 调用…", "info");
          void persistMiddleware.rehydrate().then(() => {
            log(`水合完成 → theme="${store.getState().theme}"`, "notify");
          });
        },
      },
      {
        id: "write",
        label: "手动写入 theme",
        input: { kind: "text", placeholder: "主题", value: "night" },
        run(input) {
          const theme = input.trim() || "night";
          store.setState({ theme });
          log(`setState({ theme: "${theme}" })，落盘同步更新`, "write");
        },
      },
    ],
    subscribe(listener) {
      return store.subscribe(() => listener());
    },
    dispose() {
      store.destroy();
    },
  };
}
