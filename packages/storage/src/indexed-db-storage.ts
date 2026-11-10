import type { IndexedDBStorageOptions, StorageAdapter } from "./types.js";

export function indexedDBStorage(options?: IndexedDBStorageOptions): StorageAdapter {
  const { dbName = "slux-storage", storeName = "keyval", dbVersion = 1 } = options ?? {};
  let connection: Promise<IDBDatabase> | undefined;

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
        db.onversionchange = () => {
          db.close();
          connection = undefined;
        };
        resolve(db);
      };
    });
    connection = connection.catch((error: unknown) => {
      connection = undefined;
      throw error;
    });
    return connection;
  }

  async function transact(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<unknown> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const request = action(tx.objectStore(storeName));
      // 请求成功后事务还可能回滚，只在 commit 后确认写入成功。
      tx.oncomplete = () => resolve(request.result as unknown);
      tx.onabort = () => reject(tx.error ?? request.error ?? new Error("IndexedDB 事务已中止"));
      tx.onerror = () => reject(tx.error ?? request.error ?? new Error("IndexedDB 事务失败"));
    });
  }

  return {
    async getItem(key) {
      const result = await transact("readonly", (store) => store.get(key));
      return typeof result === "string" ? result : null;
    },
    async setItem(key, value) {
      await transact("readwrite", (store) => store.put(value, key));
    },
    async removeItem(key) {
      await transact("readwrite", (store) => store.delete(key));
    },
  };
}
