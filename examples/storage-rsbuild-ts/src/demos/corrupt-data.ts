import { createStore } from "@slux/store";
import { persist, memoryStorage } from "@slux/storage";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** onError：坏数据触发 DeserializationFailed，状态保持初始值。 */
export function createCorruptDataDemo(log: Log): DemoInstance {
  const storage = memoryStorage();
  const key = "persist:corrupt";
  storage.setItem(key, "not-json{{{");

  const persistMiddleware = persist<{ theme: string }>({
    key,
    storage,
    onError: (error) => log(`onError → ${error.code}`, "error"),
  });
  const store = createStore<{ theme: string }>(() => ({ theme: "light" }), {
    middleware: [persistMiddleware],
  });

  const envelope = (): string => {
    const raw = storage.getItem(key);
    return typeof raw === "string" ? raw : "null";
  };

  return {
    readouts: [
      {
        kind: "text",
        label: "当前 theme",
        read: () => store.getState().theme,
      },
      {
        kind: "text",
        label: "落盘内容",
        read: envelope,
      },
    ],
    actions: [
      {
        id: "fix",
        label: "写回合法数据并 rehydrate()",
        primary: true,
        run() {
          storage.setItem(key, JSON.stringify({ state: { theme: "dark" }, version: 0 }));
          log("落盘内容已修复，调用 rehydrate()", "info");
          void persistMiddleware.rehydrate().then(() => {
            log(`重新水合 → theme="${store.getState().theme}"`, "notify");
          });
        },
      },
      {
        id: "break",
        label: "再写坏数据并 rehydrate()",
        run() {
          storage.setItem(key, "{{{bad");
          log("落盘内容已损坏，调用 rehydrate()", "info");
          void persistMiddleware.rehydrate().then(() => {
            log(`水合失败，theme 保持 "${store.getState().theme}"`, "error");
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
