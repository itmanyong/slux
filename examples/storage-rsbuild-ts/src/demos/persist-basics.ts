import { createStore } from "@slux/store";
import { persist, memoryStorage } from "@slux/storage";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** persist：onSet 末尾自动落盘，存储内容实时可见。 */
export function createPersistBasicsDemo(log: Log): DemoInstance {
  const storage = memoryStorage();
  const key = "persist:basic";
  const persistMiddleware = persist<{ theme: string; count: number }>({
    key,
    storage,
  });
  const store = createStore<{ theme: string; count: number }>(() => ({ theme: "light", count: 0 }), { middleware: [persistMiddleware] });
  log(`init → 自动水合，hasHydrated=${persistMiddleware.hasHydrated()}`, "info");

  const envelope = (): string => {
    const raw = storage.getItem(key);
    return typeof raw === "string" ? raw : "null";
  };

  return {
    readouts: [
      {
        kind: "text",
        label: "getState()",
        read: () => JSON.stringify(store.getState()),
      },
      {
        kind: "text",
        label: "落盘 envelope",
        read: envelope,
      },
    ],
    actions: [
      {
        id: "theme",
        label: "改 theme",
        primary: true,
        input: { kind: "text", placeholder: "主题", value: "dark" },
        run(input) {
          const theme = input.trim() || "dark";
          store.setState({ theme });
          log(`setState({ theme: "${theme}" }) → onSet 末尾自动落盘`, "write");
        },
      },
      {
        id: "count",
        label: "count +1",
        run() {
          store.setState((state) => ({ count: state.count + 1 }));
          log(`setState +1 → count=${store.getState().count}，envelope 同步更新`, "write");
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
