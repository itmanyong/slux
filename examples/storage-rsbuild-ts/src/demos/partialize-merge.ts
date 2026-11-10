import { createStore } from "@slux/store";
import { persist, memoryStorage } from "@slux/storage";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** partialize：只持久化白名单字段，敏感数据留在内存。 */
export function createPartializeMergeDemo(log: Log): DemoInstance {
  const storage = memoryStorage();
  const key = "persist:partialize";
  const persistMiddleware = persist<{ secret: string; theme: string }>({
    key,
    storage,
    partialize: (state) => ({ theme: state.theme }),
  });
  const store = createStore<{ secret: string; theme: string }>(() => ({ secret: "token-123", theme: "light" }), {
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
        label: "getState()（含 secret）",
        read: () => JSON.stringify(store.getState()),
      },
      {
        kind: "text",
        label: "落盘 envelope（不含 secret）",
        read: envelope,
      },
    ],
    actions: [
      {
        id: "secret",
        label: "改 secret（内存字段）",
        input: { kind: "text", placeholder: "secret", value: "token-456" },
        run(input) {
          const secret = input.trim() || "token-456";
          store.setState({ secret });
          log(`setState({ secret: "${secret}" }) → envelope 不含 secret，落盘内容不变`, "write");
        },
      },
      {
        id: "theme",
        label: "改 theme（落盘字段）",
        primary: true,
        input: { kind: "text", placeholder: "主题", value: "dark" },
        run(input) {
          const theme = input.trim() || "dark";
          store.setState({ theme });
          log(`setState({ theme: "${theme}" }) → envelope 已更新`, "write");
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
