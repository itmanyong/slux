import { createStore } from "@slux/store";
import { persist, memoryStorage } from "@slux/storage";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** onHydrate/hasHydrated/clearStorage：水合回调在每次水合完成时触发。 */
export function createHydrateCallbacksDemo(log: Log): DemoInstance {
  const storage = memoryStorage();
  const key = "persist:callback";
  storage.setItem(key, JSON.stringify({ state: { theme: "dark" }, version: 0 }));

  const persistMiddleware = persist<{ theme: string }>({
    key,
    storage,
    skipHydration: true,
  });
  const store = createStore<{ theme: string }>(() => ({ theme: "light" }), {
    middleware: [persistMiddleware],
  });
  persistMiddleware.onHydrate((state) => {
    log(`onHydrate → theme="${state.theme}"（hasHydrated=${persistMiddleware.hasHydrated()}）`, "notify");
  });

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
        read: (): string => {
          const raw = storage.getItem(key);
          return typeof raw === "string" ? raw : "null";
        },
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
            log(`水合完成 → theme="${store.getState().theme}"`, "info");
          });
        },
      },
      {
        id: "write",
        label: "写入 theme",
        input: { kind: "text", placeholder: "主题", value: "night" },
        run(input) {
          const theme = input.trim() || "night";
          store.setState({ theme });
          log(`setState({ theme: "${theme}" })`, "write");
        },
      },
      {
        id: "clear",
        label: "clearStorage()",
        run() {
          void persistMiddleware.clearStorage().then(() => {
            log("clearStorage → 落盘键已删除，再 rehydrate 会读到 null", "write");
          });
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
