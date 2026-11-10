import { createStore } from "@slux/store";
import { persist, memoryStorage } from "@slux/storage";
import type { ExampleDemo, LogTone } from "@slux/shell-example";

type DemoInstance = ReturnType<NonNullable<ExampleDemo["create"]>>;

type Log = (message: string, tone?: LogTone) => void;

/** version/migrate：读到旧版本 envelope 时自动迁移后再合并进状态。 */
export function createVersionMigrateDemo(log: Log): DemoInstance {
  const storage = memoryStorage();
  const key = "persist:migrate";
  // 预置一份 v1 旧数据，模拟老用户升级场景。
  storage.setItem(key, JSON.stringify({ state: { user: "bob" }, version: 1 }));

  const persistMiddleware = persist<{ user: string; nickname: string }>({
    key,
    storage,
    version: 2,
    migrate: (persisted, version) => {
      const user = persisted.user ?? "anon";
      log(`migrate: v${version} → v2，"${user}" 映射出 nickname`, "compute");
      return { user, nickname: user.toUpperCase() };
    },
  });
  const store = createStore<{ user: string; nickname: string }>(() => ({ user: "anon", nickname: "ANON" }), { middleware: [persistMiddleware] });
  log(`init → 读到 v1 旧数据并迁移，nickname="${store.getState().nickname}"`, "info");

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
        id: "rewrite",
        label: "写回 v1 旧数据并 rehydrate()",
        primary: true,
        input: { kind: "text", placeholder: "旧 user 名", value: "carol" },
        run(input) {
          const user = input.trim() || "carol";
          storage.setItem(key, JSON.stringify({ state: { user }, version: 1 }));
          log(`预置 v1 数据 user="${user}"，调用 rehydrate()`, "info");
          void persistMiddleware.rehydrate().then(() => {
            log(`迁移完成 → nickname="${store.getState().nickname}"`, "notify");
          });
        },
      },
      {
        id: "write",
        label: "写入新状态（version: 2）",
        run() {
          store.setState((state) => ({
            nickname: `${state.user.toUpperCase()}-v2`,
          }));
          log(`写入 → envelope.version=2，nickname="${store.getState().nickname}"`, "write");
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
