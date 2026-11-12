import { describe, expect, it, rstest, afterEach } from "rstack/test";
import { IDBFactory, IDBObjectStore as FakeIDBObjectStore } from "fake-indexeddb";
import { JSDOM } from "jsdom";
import { cookieStorage, indexedDBStorage, localStorageBackend, memoryStorage, sessionStorageBackend } from "../src/index.js";

afterEach(() => {
  rstest.unstubAllGlobals();
});

describe("内存和浏览器后端", () => {
  it("内存实例隔离并支持清空", async () => {
    const storage = memoryStorage();
    await storage.setItem("a", "1");
    expect(storage.getItem("a")).toBe("1");
    expect(memoryStorage().getItem("a")).toBeNull();
    storage.clear();
    expect(storage.getItem("a")).toBeNull();
  });

  it.each(["localStorage", "sessionStorage"] as const)("%s 读写删除和不可访问降级", async (name) => {
    const dom = new JSDOM("", { url: "https://example.com" });
    rstest.stubGlobal(name, dom.window[name]);
    const storage = name === "localStorage" ? localStorageBackend() : sessionStorageBackend();
    await storage.setItem("key", "value");
    expect(storage.getItem("key")).toBe("value");
    await storage.removeItem("key");
    expect(storage.getItem("key")).toBeNull();
    rstest.stubGlobal(name, undefined);
    expect(storage.getItem("key")).toBeNull();
    expect(() => storage.setItem("key", "value")).not.toThrow();
    expect(() => storage.removeItem("key")).not.toThrow();
    dom.window.close();
  });

  it("cookie 编码、属性和带 domain 的删除", async () => {
    const dom = new JSDOM("", { url: "https://sub.example.com/app/" });
    rstest.stubGlobal("document", dom.window.document);
    const storage = cookieStorage({
      path: "/app",
      domain: "example.com",
      secure: true,
      sameSite: "lax",
      maxAge: 300,
    });
    await storage.setItem("偏好", "a=b;中文");
    expect(storage.getItem("偏好")).toBe("a=b;中文");
    const cookies = dom.cookieJar.getCookiesSync("https://sub.example.com/app/");
    expect(cookies[0]?.domain).toBe("example.com");
    expect(cookies[0]?.secure).toBe(true);
    expect(cookies[0]?.sameSite).toBe("lax");
    await storage.removeItem("偏好");
    expect(storage.getItem("偏好")).toBeNull();
    dom.window.close();
  });

  it("cookie 在 SSR 下安全降级", () => {
    rstest.stubGlobal("document", undefined);
    const storage = cookieStorage();
    expect(storage.getItem("key")).toBeNull();
    expect(() => storage.setItem("key", "value")).not.toThrow();
    expect(() => storage.removeItem("key")).not.toThrow();
  });
});

describe("IndexedDB 后端", () => {
  it("真实事务完成后支持读写删除并复用连接", async () => {
    const factory = new IDBFactory();
    rstest.stubGlobal("indexedDB", factory);
    const open = rstest.spyOn(factory, "open");
    const storage = indexedDBStorage({
      dbName: "test",
      storeName: "state",
      dbVersion: 2,
    });
    expect(open).not.toHaveBeenCalled();
    await storage.setItem("key", "first");
    expect(await storage.getItem("key")).toBe("first");
    await storage.setItem("key", "second");
    expect(await storage.getItem("key")).toBe("second");
    await storage.removeItem("key");
    expect(await storage.getItem("key")).toBeNull();
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith("test", 2);
  });

  it("SSR 拒绝操作，后端恢复后可重试打开", async () => {
    rstest.stubGlobal("indexedDB", undefined);
    const storage = indexedDBStorage();
    await expect(storage.getItem("key")).rejects.toThrow();
    rstest.stubGlobal("indexedDB", new IDBFactory());
    await storage.setItem("key", "value");
    expect(await storage.getItem("key")).toBe("value");
  });

  it("事务在请求成功后 abort 仍然报告写入失败", async () => {
    const factory = new IDBFactory();
    rstest.stubGlobal("indexedDB", factory);
    const storage = indexedDBStorage({ dbName: "abort" });
    await storage.getItem("init");
    const put = FakeIDBObjectStore.prototype.put;
    const spy = rstest.spyOn(FakeIDBObjectStore.prototype, "put").mockImplementation(function (
      this: IDBObjectStore,
      ...args: Parameters<IDBObjectStore["put"]>
    ) {
      const request = put.apply(this, args);
      request.addEventListener("success", () => this.transaction.abort());
      return request;
    });
    try {
      await expect(storage.setItem("key", "lost")).rejects.toThrow();
    } finally {
      spy.mockRestore();
    }
    expect(await storage.getItem("key")).toBeNull();
  });
});
