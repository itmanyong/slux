import { describe, it, expect, rstest as vi, beforeEach } from "rstack/test";
import { createStore, type Middleware } from "@slux/store";
import { persist, memoryStorage, PERSIST_ERROR_CODE, type StorageAdapter, type PersistMiddleware, type PersistEnvelope } from "../src/index.js";

type TestState = {
  count: number;
  name: string;
  increment: () => void;
};

function createTestStore(middleware: PersistMiddleware<TestState>) {
  return createStore<TestState>(
    (set) => ({
      count: 0,
      name: "test",
      increment: () => {
        set((s) => ({ count: s.count + 1 }));
      },
    }),
    { middleware: [middleware] },
  );
}

function createAsyncStorage(data = new Map<string, string>()): StorageAdapter {
  return {
    getItem: vi.fn((key: string) => Promise.resolve(data.get(key) ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      data.delete(key);
      return Promise.resolve();
    }),
  };
}

describe("persist middleware", () => {
  describe("middleware shape", () => {
    it('has name "persist"', () => {
      const mw = persist<TestState>({ key: "test" });
      expect(mw.name).toBe("persist");
    });

    it("has correct hooks", () => {
      const mw = persist<TestState>({ key: "test" });
      expect(typeof mw.init).toBe("function");
      expect(typeof mw.onSet).toBe("function");
      expect(typeof mw.onDestroy).toBe("function");
    });

    it("has extended methods", () => {
      const mw = persist<TestState>({ key: "test" });
      expect(typeof mw.rehydrate).toBe("function");
      expect(typeof mw.hasHydrated).toBe("function");
      expect(typeof mw.onHydrate).toBe("function");
      expect(typeof mw.clearStorage).toBe("function");
    });

    it("structurally satisfies Middleware<T> from store", () => {
      const mw = persist<TestState>({ key: "test" });
      const _storeMiddleware: Middleware<TestState> = mw;
      expect(_storeMiddleware.name).toBe("persist");
    });
  });

  describe("sync hydration (memoryStorage)", () => {
    let storage: ReturnType<typeof memoryStorage>;

    beforeEach(() => {
      storage = memoryStorage();
    });

    it("hydrates state on init from storage", () => {
      void storage.setItem("test", JSON.stringify({ state: { count: 42, name: "hydrated" }, version: 0 }));

      const mw = persist<TestState>({ key: "test", storage });
      const store = createTestStore(mw);

      expect(store.getState().count).toBe(42);
      expect(store.getState().name).toBe("hydrated");
    });

    it("merges persisted state with initial state (shallow merge)", () => {
      void storage.setItem("test", JSON.stringify({ state: { count: 10 }, version: 0 }));

      const mw = persist<TestState>({ key: "test", storage });
      const store = createTestStore(mw);

      expect(store.getState().count).toBe(10);
      expect(store.getState().name).toBe("test");
      expect(typeof store.getState().increment).toBe("function");
    });

    it("uses custom merge function when provided", () => {
      void storage.setItem("test", JSON.stringify({ state: { count: 5 }, version: 0 }));

      const mw = persist<TestState>({
        key: "test",
        storage,
        merge: (persisted, current) => ({
          ...current,
          ...persisted,
          count: (persisted.count ?? 0) * 2,
        }),
      });
      const store = createTestStore(mw);

      expect(store.getState().count).toBe(10);
    });

    it("does not modify state when storage is empty", () => {
      const mw = persist<TestState>({ key: "test", storage });
      const store = createTestStore(mw);

      expect(store.getState().count).toBe(0);
      expect(store.getState().name).toBe("test");
    });

    it("hasHydrated returns true after init", () => {
      const mw = persist<TestState>({ key: "test", storage });
      createTestStore(mw);

      expect(mw.hasHydrated()).toBe(true);
    });

    it("fires onHydrate callbacks after init", () => {
      void storage.setItem("test", JSON.stringify({ state: { count: 7 }, version: 0 }));

      const callback = vi.fn();
      const mw = persist<TestState>({ key: "test", storage });

      mw.onHydrate(callback);
      createTestStore(mw);

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ count: 7 }));
    });

    it("skipHydration prevents auto-hydration", () => {
      void storage.setItem("test", JSON.stringify({ state: { count: 99 }, version: 0 }));

      const mw = persist<TestState>({
        key: "test",
        storage,
        skipHydration: true,
      });
      const store = createTestStore(mw);

      expect(store.getState().count).toBe(0);
      expect(mw.hasHydrated()).toBe(false);
    });

    it("manual rehydrate works after skipHydration", async () => {
      void storage.setItem("test", JSON.stringify({ state: { count: 55 }, version: 0 }));

      const mw = persist<TestState>({
        key: "test",
        storage,
        skipHydration: true,
      });
      const store = createTestStore(mw);

      expect(store.getState().count).toBe(0);

      await mw.rehydrate();

      expect(store.getState().count).toBe(55);
      expect(mw.hasHydrated()).toBe(true);
    });
  });

  describe("async hydration", () => {
    it("returns initial state before async hydration resolves", () => {
      const data = new Map<string, string>();
      data.set("test", JSON.stringify({ state: { count: 100 }, version: 0 }));
      const storage = createAsyncStorage(data);

      const mw = persist<TestState>({ key: "test", storage });
      const store = createTestStore(mw);

      expect(store.getState().count).toBe(0);
      expect(mw.hasHydrated()).toBe(false);
    });

    it("updates state after async hydration resolves", async () => {
      const data = new Map<string, string>();
      data.set("test", JSON.stringify({ state: { count: 100 }, version: 0 }));
      const storage = createAsyncStorage(data);

      const mw = persist<TestState>({ key: "test", storage });
      const store = createTestStore(mw);

      await vi.waitFor(() => {
        expect(mw.hasHydrated()).toBe(true);
      });

      expect(store.getState().count).toBe(100);
    });

    it("hasHydrated is false initially, true after resolve", async () => {
      const storage = createAsyncStorage();

      const mw = persist<TestState>({ key: "test", storage });
      createTestStore(mw);

      expect(mw.hasHydrated()).toBe(false);

      await vi.waitFor(() => {
        expect(mw.hasHydrated()).toBe(true);
      });
    });

    it("fires callbacks after async hydration", async () => {
      const data = new Map<string, string>();
      data.set("test", JSON.stringify({ state: { count: 77 }, version: 0 }));
      const storage = createAsyncStorage(data);

      const callback = vi.fn();
      const mw = persist<TestState>({ key: "test", storage });
      mw.onHydrate(callback);
      createTestStore(mw);

      expect(callback).not.toHaveBeenCalled();

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledOnce();
      });

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ count: 77 }));
    });
  });

  describe("persistence on setState", () => {
    let storage: ReturnType<typeof memoryStorage>;

    beforeEach(() => {
      storage = memoryStorage();
    });

    it("persists state after each setState", () => {
      const mw = persist<TestState>({ key: "test", storage });
      const store = createTestStore(mw);

      store.setState({ count: 5 });

      const raw = storage.getItem("test");
      expect(raw).not.toBeNull();
      const envelope = JSON.parse(raw as string) as PersistEnvelope<Partial<TestState>>;
      expect(envelope.state.count).toBe(5);
    });

    it("applies partialize before persisting", () => {
      const mw = persist<TestState>({
        key: "test",
        storage,
        partialize: (s) => ({ count: s.count }),
      });
      const store = createTestStore(mw);

      store.setState({ count: 42 });

      const raw = storage.getItem("test");
      const envelope = JSON.parse(raw as string) as PersistEnvelope<Partial<TestState>>;
      expect(envelope.state).toEqual({ count: 42 });
      expect(envelope.state.name).toBeUndefined();
    });

    it("writes correct envelope with version", () => {
      const mw = persist<TestState>({
        key: "test",
        storage,
        version: 3,
      });
      const store = createTestStore(mw);

      store.setState({ count: 1 });

      const raw = storage.getItem("test");
      const envelope = JSON.parse(raw as string) as PersistEnvelope<Partial<TestState>>;
      expect(envelope.version).toBe(3);
    });

    it("uses custom serialize/deserialize", () => {
      const serialize = vi.fn((envelope: PersistEnvelope<Partial<TestState>>) => `custom:${JSON.stringify(envelope)}`);
      const deserialize = vi.fn((value: string) => JSON.parse(value.replace("custom:", "")) as PersistEnvelope<Partial<TestState>>);

      const mw = persist<TestState>({
        key: "test",
        storage,
        serialize,
        deserialize,
      });
      const store = createTestStore(mw);

      store.setState({ count: 9 });

      expect(serialize).toHaveBeenCalled();
      const raw = storage.getItem("test");
      expect(raw).toMatch(/^custom:/);
    });

    it("handles async storage writes (fire-and-forget)", async () => {
      const asyncStorage = createAsyncStorage();
      const mw = persist<TestState>({ key: "test", storage: asyncStorage });
      const store = createTestStore(mw);

      await vi.waitFor(() => {
        expect(mw.hasHydrated()).toBe(true);
      });

      store.setState({ count: 15 });

      await vi.waitFor(() => {
        expect(asyncStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe("version migration", () => {
    let storage: ReturnType<typeof memoryStorage>;

    beforeEach(() => {
      storage = memoryStorage();
    });

    it("calls migrate when versions differ", () => {
      void storage.setItem("test", JSON.stringify({ state: { count: 5 }, version: 1 }));

      const migrate = vi.fn((persisted: Partial<TestState>) => persisted);
      const mw = persist<TestState>({
        key: "test",
        storage,
        version: 2,
        migrate,
      });
      createTestStore(mw);

      expect(migrate).toHaveBeenCalledOnce();
    });

    it("passes persisted state and old version to migrate", () => {
      void storage.setItem("test", JSON.stringify({ state: { count: 5, name: "old" }, version: 1 }));

      const migrate = vi.fn((persisted: Partial<TestState>) => persisted);
      const mw = persist<TestState>({
        key: "test",
        storage,
        version: 2,
        migrate,
      });
      createTestStore(mw);

      expect(migrate).toHaveBeenCalledWith({ count: 5, name: "old" }, 1);
    });

    it("applies migrated state", () => {
      void storage.setItem("test", JSON.stringify({ state: { count: 5 }, version: 1 }));

      const mw = persist<TestState>({
        key: "test",
        storage,
        version: 2,
        migrate: (persisted) => ({
          ...persisted,
          name: "migrated",
        }),
      });
      const store = createTestStore(mw);

      expect(store.getState().name).toBe("migrated");
      expect(store.getState().count).toBe(5);
    });

    it("supports async migrate", async () => {
      void storage.setItem("test", JSON.stringify({ state: { count: 3 }, version: 1 }));

      const mw = persist<TestState>({
        key: "test",
        storage,
        version: 2,
        migrate: async (persisted) => {
          await Promise.resolve();
          return {
            ...persisted,
            name: "async-migrated",
          };
        },
      });
      const store = createTestStore(mw);

      await vi.waitFor(() => {
        expect(mw.hasHydrated()).toBe(true);
      });

      expect(store.getState().name).toBe("async-migrated");
    });

    it("skips hydration when versions differ and no migrate provided", () => {
      void storage.setItem("test", JSON.stringify({ state: { count: 999 }, version: 1 }));

      const mw = persist<TestState>({
        key: "test",
        storage,
        version: 2,
      });
      const store = createTestStore(mw);

      expect(store.getState().count).toBe(0);
      expect(mw.hasHydrated()).toBe(true);
    });

    it("persists with current version after migration", () => {
      void storage.setItem("test", JSON.stringify({ state: { count: 5 }, version: 1 }));

      const mw = persist<TestState>({
        key: "test",
        storage,
        version: 2,
        migrate: (persisted) => persisted,
      });
      const store = createTestStore(mw);
      store.setState({ count: 10 });

      const raw = storage.getItem("test");
      const envelope = JSON.parse(raw as string) as PersistEnvelope<Partial<TestState>>;
      expect(envelope.version).toBe(2);
    });
  });

  describe("error handling", () => {
    it("uses initial state on storage read failure, fires onError", () => {
      const onError = vi.fn();
      const failingStorage: StorageAdapter = {
        getItem: () => {
          throw new Error("read error");
        },
        setItem: () => {},
        removeItem: () => {},
      };

      const mw = persist<TestState>({
        key: "test",
        storage: failingStorage,
        onError,
      });
      const store = createTestStore(mw);

      expect(store.getState().count).toBe(0);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: PERSIST_ERROR_CODE.StorageReadFailed,
        }),
      );
    });

    it("state update succeeds on storage write failure, fires onError", () => {
      const onError = vi.fn();
      const storage = memoryStorage();
      const failWriteStorage: StorageAdapter = {
        getItem: (key) => storage.getItem(key),
        setItem: () => {
          throw new Error("write error");
        },
        removeItem: (key) => storage.removeItem(key),
      };

      const mw = persist<TestState>({
        key: "test",
        storage: failWriteStorage,
        onError,
      });
      const store = createTestStore(mw);

      store.setState({ count: 5 });

      expect(store.getState().count).toBe(5);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: PERSIST_ERROR_CODE.StorageWriteFailed,
        }),
      );
    });

    it("uses initial state on corrupt data (bad JSON), fires onError", () => {
      const onError = vi.fn();
      const storage = memoryStorage();
      void storage.setItem("test", "not-valid-json{{{");

      const mw = persist<TestState>({
        key: "test",
        storage,
        onError,
      });
      const store = createTestStore(mw);

      expect(store.getState().count).toBe(0);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: PERSIST_ERROR_CODE.DeserializationFailed,
        }),
      );
    });

    it("uses initial state when migrate throws, fires onError", () => {
      const onError = vi.fn();
      const storage = memoryStorage();
      void storage.setItem("test", JSON.stringify({ state: { count: 5 }, version: 1 }));

      const mw = persist<TestState>({
        key: "test",
        storage,
        version: 2,
        migrate: () => {
          throw new Error("migration error");
        },
        onError,
      });
      const store = createTestStore(mw);

      expect(store.getState().count).toBe(0);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: PERSIST_ERROR_CODE.MigrationFailed,
        }),
      );
    });

    it("fires onError for async migrate failure", async () => {
      const onError = vi.fn();
      const storage = memoryStorage();
      void storage.setItem("test", JSON.stringify({ state: { count: 5 }, version: 1 }));

      const mw = persist<TestState>({
        key: "test",
        storage,
        version: 2,
        migrate: async () => {
          await Promise.resolve();
          throw new Error("async migration error");
        },
        onError,
      });
      createTestStore(mw);

      await vi.waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: PERSIST_ERROR_CODE.MigrationFailed,
          }),
        );
      });
    });

    it("fires onError for serialization failure", () => {
      const onError = vi.fn();
      const storage = memoryStorage();

      const mw = persist<TestState>({
        key: "test",
        storage,
        serialize: () => {
          throw new Error("serialize error");
        },
        onError,
      });
      const store = createTestStore(mw);

      store.setState({ count: 1 });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: PERSIST_ERROR_CODE.SerializationFailed,
        }),
      );
    });

    it("fires onError for async storage read failure", async () => {
      const onError = vi.fn();
      const failingAsync: StorageAdapter = {
        getItem: () => Promise.reject(new Error("async read error")),
        setItem: () => Promise.resolve(),
        removeItem: () => Promise.resolve(),
      };

      const mw = persist<TestState>({
        key: "test",
        storage: failingAsync,
        onError,
      });
      createTestStore(mw);

      await vi.waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: PERSIST_ERROR_CODE.StorageReadFailed,
          }),
        );
      });
    });

    it("fires onError for async storage write failure", async () => {
      const onError = vi.fn();
      const failWriteAsync: StorageAdapter = {
        getItem: () => Promise.resolve(null),
        setItem: () => Promise.reject(new Error("async write error")),
        removeItem: () => Promise.resolve(),
      };

      const mw = persist<TestState>({
        key: "test",
        storage: failWriteAsync,
        onError,
      });
      const store = createTestStore(mw);

      await vi.waitFor(() => {
        expect(mw.hasHydrated()).toBe(true);
      });

      store.setState({ count: 1 });

      await vi.waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: PERSIST_ERROR_CODE.StorageWriteFailed,
          }),
        );
      });
    });

    it("does not crash when onError is not provided", () => {
      const failingStorage: StorageAdapter = {
        getItem: () => {
          throw new Error("read error");
        },
        setItem: () => {
          throw new Error("write error");
        },
        removeItem: () => {},
      };

      const mw = persist<TestState>({
        key: "test",
        storage: failingStorage,
      });
      const store = createTestStore(mw);

      expect(store.getState().count).toBe(0);
      store.setState({ count: 1 });
      expect(store.getState().count).toBe(1);
    });
  });

  describe("extended API", () => {
    it("clearStorage removes key from storage", async () => {
      const storage = memoryStorage();
      void storage.setItem("test", JSON.stringify({ state: { count: 1 }, version: 0 }));

      const mw = persist<TestState>({ key: "test", storage });
      createTestStore(mw);

      await mw.clearStorage();
      expect(storage.getItem("test")).toBeNull();
    });

    it("rehydrate re-reads from storage", async () => {
      const storage = memoryStorage();
      const mw = persist<TestState>({ key: "test", storage });
      const store = createTestStore(mw);

      expect(store.getState().count).toBe(0);
      void storage.setItem("test", JSON.stringify({ state: { count: 200 }, version: 0 }));

      await mw.rehydrate();
      expect(store.getState().count).toBe(200);
    });

    it("onHydrate fires immediately if already hydrated", async () => {
      const storage = memoryStorage();
      const mw = persist<TestState>({ key: "test", storage });
      createTestStore(mw);

      expect(mw.hasHydrated()).toBe(true);

      const callback = vi.fn();
      mw.onHydrate(callback);
      expect(callback).not.toHaveBeenCalled();
      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledOnce();
      });
    });

    it("onHydrate unsub prevents callback from firing", async () => {
      const storage = memoryStorage();
      const mw = persist<TestState>({ key: "test", storage });
      createTestStore(mw);

      const callback = vi.fn();
      const unsub = mw.onHydrate(callback);
      unsub();
      await new Promise<void>((resolve) => {
        queueMicrotask(resolve);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("store destroyed during async migration does not apply state", async () => {
      const storage = memoryStorage();
      void storage.setItem("test", JSON.stringify({ state: { count: 50 }, version: 1 }));

      let resolvePromise: ((value: Partial<TestState>) => void) | undefined;
      const mw = persist<TestState>({
        key: "test",
        storage,
        version: 2,
        migrate: () =>
          new Promise<Partial<TestState>>((resolve) => {
            resolvePromise = resolve;
          }),
      });
      const store = createTestStore(mw);
      store.destroy();
      resolvePromise?.({ count: 999 });
      await new Promise<void>((resolve) => {
        queueMicrotask(resolve);
      });
      expect(mw.hasHydrated()).toBe(false);
    });

    it("rehydrate after destroy resolves immediately", async () => {
      const storage = memoryStorage();
      const mw = persist<TestState>({ key: "test", storage });
      const store = createTestStore(mw);

      store.destroy();
      await mw.rehydrate();
    });

    it("store destroyed before async hydration does not crash", async () => {
      const data = new Map<string, string>();
      data.set("test", JSON.stringify({ state: { count: 50 }, version: 0 }));
      const storage = createAsyncStorage(data);

      const mw = persist<TestState>({ key: "test", storage });
      const store = createTestStore(mw);

      store.destroy();
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });
    });

    it("empty partialize result is still persisted", () => {
      const storage = memoryStorage();
      const mw = persist<TestState>({
        key: "test",
        storage,
        partialize: () => ({}),
      });
      const store = createTestStore(mw);

      store.setState({ count: 5 });

      const raw = storage.getItem("test");
      expect(raw).not.toBeNull();
      const envelope = JSON.parse(raw as string) as PersistEnvelope<Partial<TestState>>;
      expect(envelope.state).toEqual({});
    });

    it("storage returns empty string — treated as null", () => {
      const storage = memoryStorage();
      void storage.setItem("test", "");

      const mw = persist<TestState>({ key: "test", storage });
      const store = createTestStore(mw);

      expect(store.getState().count).toBe(0);
      expect(mw.hasHydrated()).toBe(true);
    });

    it("envelope missing version defaults to 0", () => {
      const storage = memoryStorage();
      void storage.setItem("test", JSON.stringify({ state: { count: 33 } }));

      const mw = persist<TestState>({ key: "test", storage, version: 0 });
      const store = createTestStore(mw);

      expect(store.getState().count).toBe(33);
    });

    it("defaults to memoryStorage when no storage provided", () => {
      const mw = persist<TestState>({ key: "test" });
      const store = createTestStore(mw);

      store.setState({ count: 7 });
      expect(store.getState().count).toBe(7);
      expect(mw.hasHydrated()).toBe(true);
    });

    it("persists via action functions (not just direct setState)", () => {
      const storage = memoryStorage();
      const mw = persist<TestState>({ key: "test", storage });
      const store = createTestStore(mw);

      store.getState().increment();

      const raw = storage.getItem("test");
      expect(raw).not.toBeNull();
      const envelope = JSON.parse(raw as string) as PersistEnvelope<Partial<TestState>>;
      expect(envelope.state.count).toBe(1);
    });

    it("onDestroy cleans up callbacks and api reference", () => {
      const storage = memoryStorage();
      const mw = persist<TestState>({ key: "test", storage });
      const store = createTestStore(mw);

      const callback = vi.fn();
      mw.onHydrate(callback);

      store.destroy();
      expect(mw.hasHydrated()).toBe(true);
    });
  });
});
