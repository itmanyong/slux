import { createStore, type Middleware, type MiddlewareAPI, type SetFn, type Listener } from "@slux/store";
import {
  persist,
  memoryStorage,
  type PersistMiddlewareAPI,
  type PersistSetFn,
  type PersistListener,
  type PersistEnvelope,
  type PersistMiddleware,
  type PersistOptions,
  type StorageAdapter,
} from "../src/index.js";

type State = { count: number; label: string };

// 由 tsc 编译验证，不在运行时调用。
export function checkTypes(api: MiddlewareAPI<State>, set: SetFn<State>, listener: Listener<State>): void {
  const persistApi: PersistMiddlewareAPI<State> = api;
  const persistSet: PersistSetFn<State> = set;
  const persistListener: PersistListener<State> = listener;
  const middleware: PersistMiddleware<State> = persist<State>({
    key: "state",
    partialize: (state) => ({ count: state.count }),
    migrate: async (state, version) => ({ count: (state.count ?? 0) + version }),
  });
  const compatible: Middleware<State> = middleware;
  const store = createStore(() => ({ count: 0, label: "test" }), { middleware: [compatible] });
  const ready: Promise<void> = middleware.rehydrate();
  const clear: Promise<void> = middleware.clearStorage();
  const unsub: () => void = middleware.onHydrate((state) => {
    const count: number = state.count;
    void count;
  });
  const envelope: PersistEnvelope<Partial<State>> = { state: { count: 2 }, version: 0 };
  const storage: StorageAdapter = memoryStorage();
  const options: PersistOptions<State> = { key: "state", storage, serialize: (value) => JSON.stringify(value) };
  void [persistApi, persistSet, persistListener, store, ready, clear, unsub, envelope, options];
  // @ts-expect-error partialize 必须返回状态的有效字段类型。
  persist<State>({ key: "state", partialize: () => ({ count: "wrong" }) });
  // @ts-expect-error 存储写入只接受序列化字符串。
  storage.setItem("state", 2);
}
