import { describe, expect, it, rstest } from "rstack/test";
import { createStore } from "@slux/store";
import { computed } from "@slux/core";
import { persist, memoryStorage, PERSIST_ERROR_CODE, type StorageAdapter } from "../src/index.js";

type State = { count: number };
const saved = (count: number, version = 0) => JSON.stringify({ state: { count }, version });
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function setup(storage: StorageAdapter, options: Partial<Parameters<typeof persist<State>>[0]> = {}) {
  const mw = persist<State>({ key: "state", storage, ...options });
  const store = createStore(() => ({ count: 0 }), { middleware: [mw] });
  return { mw, store };
}

describe("异步生命周期和真实 Store 集成", () => {
  it("异步 hydration 通知 core 派生值", async () => {
    const read = deferred<string | null>();
    const { mw, store } = setup({ ...memoryStorage(), getItem: () => read.promise });
    const double = computed(() => store.get().count * 2);
    expect(double.get()).toBe(0);
    const done = mw.rehydrate();
    read.resolve(saved(5));
    await done;
    expect(double.get()).toBe(10);
  });

  it("并发 rehydrate 复用读取并等待异步迁移", async () => {
    const migration = deferred<Partial<State>>();
    const storage = memoryStorage();
    await storage.setItem("state", saved(1, 0));
    const read = rstest.spyOn(storage, "getItem");
    const { mw, store } = setup(storage, { skipHydration: true, version: 1, migrate: () => migration.promise });
    const first = mw.rehydrate();
    const second = mw.rehydrate();
    expect(first).toBe(second);
    expect(read).toHaveBeenCalledTimes(1);
    expect(mw.hasHydrated()).toBe(false);
    migration.resolve({ count: 4 });
    await first;
    expect(store.getState().count).toBe(4);
    expect(mw.hasHydrated()).toBe(true);
  });

  it("destroy 结束等待中的 rehydrate 并忽略迟到结果", async () => {
    const read = deferred<string | null>();
    const storage = { ...memoryStorage(), getItem: () => read.promise };
    const { mw, store } = setup(storage);
    const callback = rstest.fn();
    mw.onHydrate(callback);
    const pending = mw.rehydrate();
    store.destroy();
    await pending;
    read.resolve(saved(9));
    await read.promise;
    expect(store.getState().count).toBe(0);
    expect(callback).not.toHaveBeenCalled();
    expect(mw.hasHydrated()).toBe(false);
  });

  it("写入按调用顺序完成，clearStorage 等待此前写入", async () => {
    const first = deferred<void>();
    const data = memoryStorage();
    const writes: number[] = [];
    const storage: StorageAdapter = {
      ...data,
      async setItem(key, value) {
        const count = (JSON.parse(value) as { state: State }).state.count;
        writes.push(count);
        if (count === 1) await first.promise;
        await data.setItem(key, value);
      },
    };
    const { store, mw } = setup(storage);
    store.setState({ count: 1 });
    store.setState({ count: 2 });
    const cleared = mw.clearStorage();
    expect(writes).toEqual([1]);
    first.resolve();
    await cleared;
    expect(writes).toEqual([1, 2]);
    expect(data.getItem("state")).toBeNull();
    expect(store.getState().count).toBe(2);
  });

  it("一次异步写入失败不会阻塞后续写入", async () => {
    const first = deferred<void>();
    const values: string[] = [];
    const error = rstest.fn();
    const { mw, store } = setup(
      {
        getItem: () => null,
        setItem(_key, value) {
          values.push(value);
          return values.length === 1 ? first.promise : undefined;
        },
        removeItem() {},
      },
      { onError: error },
    );
    store.setState({ count: 1 });
    store.setState({ count: 2 });
    first.reject(new Error("quota"));
    await mw.clearStorage();
    expect(values).toEqual([saved(1), saved(2)]);
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ code: PERSIST_ERROR_CODE.StorageWriteFailed }));
  });

  it("destroy 取消尚未开始的写入和删除", async () => {
    const first = deferred<void>();
    const writes = rstest.fn(() => first.promise);
    const remove = rstest.fn();
    const { mw, store } = setup({ getItem: () => null, setItem: writes, removeItem: remove });
    store.setState({ count: 1 });
    store.setState({ count: 2 });
    const pending = mw.clearStorage();
    store.destroy();
    first.resolve();
    await pending;
    await mw.clearStorage();
    expect(writes).toHaveBeenCalledTimes(1);
    expect(remove).not.toHaveBeenCalled();
  });

  it("清理失败由 onError 报告，控制器仍返回 Promise", async () => {
    const error = rstest.fn();
    const { mw } = setup(
      {
        ...memoryStorage(),
        removeItem() {
          throw new Error("remove failed");
        },
      },
      { onError: error },
    );
    await expect(mw.clearStorage()).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ code: PERSIST_ERROR_CODE.StorageWriteFailed }));
  });

  it.each(["null", "{}", '{"state":{},"version":"wrong"}'])("坏 envelope %s 不改变内存状态", async (raw) => {
    const data = memoryStorage();
    await data.setItem("state", raw);
    const error = rstest.fn();
    const { store, mw } = setup(data, { onError: error });
    expect(store.getState().count).toBe(0);
    expect(mw.hasHydrated()).toBe(true);
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ code: PERSIST_ERROR_CODE.DeserializationFailed }));
  });

  it("partialize 和错误观察器抛错不影响内存更新", () => {
    const { store } = setup(memoryStorage(), {
      partialize() {
        throw new Error("select");
      },
      onError() {
        throw new Error("report");
      },
    });
    expect(() => store.setState({ count: 3 })).not.toThrow();
    expect(store.getState().count).toBe(3);
  });

  it("hydration 观察器失败不阻塞其他观察器和完成 Promise", async () => {
    const { mw } = setup(memoryStorage(), { skipHydration: true });
    mw.onHydrate(() => {
      throw new Error("listener");
    });
    const callback = rstest.fn();
    mw.onHydrate(callback);
    await mw.rehydrate();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("新的 hydration 不重复触发此前排队的立即回调", async () => {
    const { mw } = setup(memoryStorage());
    const callback = rstest.fn();
    mw.onHydrate(callback);
    await mw.rehydrate();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
