import { createStore } from "@slux/store";
import { persist, memoryStorage } from "@slux/storage";

const storage = memoryStorage();
storage.setItem("persist:migrate", JSON.stringify({ state: { user: "bob" }, version: 1 }));

const persistMiddleware = persist<{ user: string; nickname: string }>({
  key: "persist:migrate",
  storage,
  version: 2,
  migrate: (persisted) => {
    const user = persisted.user ?? "anon";
    return { user, nickname: user.toUpperCase() };
  },
});

const store = createStore<{ user: string; nickname: string }>(() => ({ user: "anon", nickname: "ANON" }), { middleware: [persistMiddleware] });

console.log(store.getState().nickname); // → BOB（v1 旧数据在 init 时自动迁移）
