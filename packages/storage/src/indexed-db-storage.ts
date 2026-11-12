/**
 * @file 提供基于 IndexedDB 的异步存储适配器，把键值读写封装为只读/读写事务。
 * 连接以 Promise 形式缓存在闭包内复用，可能因 versionchange 关闭并重建。
 */
import type { IndexedDBStorageOptions, StorageAdapter } from "./types.js";

/**
 * 创建一个以 IndexedDB 为后端的异步存储适配器，连接在同一实例内惰性创建并复用。
 * @param options 可选配置；为 undefined 时 dbName/storeName/dbVersion 分别取默认值。
 * @returns 实现 StorageAdapter 的对象；getItem 未命中或结果非字符串时返回 null。
 * @remarks 打开失败、事务中止或事务出错均以拒绝的 Promise 传播。
 * @see StorageAdapter
 * @see IndexedDBStorageOptions
 */
export function indexedDBStorage(options?: IndexedDBStorageOptions): StorageAdapter {
  const { dbName = "slux-storage", storeName = "keyval", dbVersion = 1 } = options ?? {};
  let connection: Promise<IDBDatabase> | undefined;

  /**
   * 惰性打开并返回数据库连接，同一实例内复用。
   * 缓存连接 Promise（而非已完成的 db）使并发调用共享同一次打开过程，避免竞态重复建连。
   * @returns 解析为 IDBDatabase 的 Promise；连接由闭包持有，调用方不应自行关闭。
   * @remarks 打开失败时 reject 并清空缓存以便重试；versionchange 时关闭连接并失效缓存。
   */
  function open(): Promise<IDBDatabase> {
    if (connection !== undefined) return connection;
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, dbVersion);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName);
      };
      request.onerror = () => reject(request.error ?? new Error("IndexedDB 打开失败"));
      request.onsuccess = () => {
        const db = request.result;
        // 其它连接触发版本升级时关闭本连接并失效缓存，使后续调用重新打开新版本库。
        db.onversionchange = () => {
          db.close();
          connection = undefined;
        };
        resolve(db);
      };
    });
    // 打开失败后清空缓存，让下一次调用重新尝试，而非永久复用已失败的 Promise。
    connection = connection.catch((error: unknown) => {
      connection = undefined;
      throw error;
    });
    return connection;
  }

  /**
   * 在目标对象仓库上执行一次事务，并以事务完成（而非请求成功）作为成功确认点。
   * @param mode 事务模式，读用 "readonly"、写用 "readwrite"。
   * @param action 接收 IDBObjectStore 并返回 IDBRequest 的回调。
   * @returns 解析为请求 result 的 Promise，具体类型由 action 决定。
   * @remarks 事务 abort 或 error 时 reject，错误按 tx.error → request.error → 通用 Error 顺序回退。
   */
  async function transact(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<unknown> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const request = action(tx.objectStore(storeName));
      // 请求成功不代表事务已提交，事务仍可能回滚，故仅在 tx.oncomplete 时确认成功。
      tx.oncomplete = () => resolve(request.result as unknown);
      tx.onabort = () => reject(tx.error ?? request.error ?? new Error("IndexedDB 事务已中止"));
      tx.onerror = () => reject(tx.error ?? request.error ?? new Error("IndexedDB 事务失败"));
    });
  }

  return {
    /**
     * 读取指定键的值。
     * @param key 键名。
     * @returns 命中且结果为字符串时返回该字符串，否则返回 null。
     */
    async getItem(key) {
      const result = await transact("readonly", (store) => store.get(key));
      return typeof result === "string" ? result : null;
    },
    /**
     * 写入或覆盖指定键的值。
     * @param key 键名。
     * @param value 待写入字符串。
     */
    async setItem(key, value) {
      await transact("readwrite", (store) => store.put(value, key)); // 注意 put 的参数顺序为「值, 键」。
    },
    /**
     * 删除指定键。
     * @param key 待删除键名。
     */
    async removeItem(key) {
      await transact("readwrite", (store) => store.delete(key));
    },
  };
}
