/**
 * @file 提供基于 localStorage 与 sessionStorage 的同步存储适配器工厂。
 * 访问异常一律吞掉，不向调用方传播。
 */
import type { StorageAdapter } from "./types.js";
/**
 * 创建一个以全局 localStorage 为后端的同步存储适配器。
 * @returns 实现 StorageAdapter 的对象；getItem 未命中或读取失败时返回 null，写方法失败时静默返回。
 * @see StorageAdapter
 * @see sessionStorageBackend
 */
export function localStorageBackend(): StorageAdapter {
  return {
    /**
     * 按键读取值。
     * @param key 键名，区分大小写。
     * @returns 命中时的字符串；未命中或读取抛错时返回 null。
     */
    getItem(key: string): string | null {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    /**
     * 写入或覆盖键值。
     * @param key 键名，区分大小写。
     * @param value 待写入字符串，直接存放不做序列化。
     */
    setItem(key: string, value: string): void {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* 后端不可用时忽略操作。 */
      }
    },
    /**
     * 删除指定键。
     * @param key 待删除键名，区分大小写。
     */
    removeItem(key: string): void {
      try {
        localStorage.removeItem(key);
      } catch {
        /* 后端不可用时忽略操作。 */
      }
    },
  };
}

/**
 * 创建一个以全局 sessionStorage 为后端的同步存储适配器，与 localStorageBackend 结构一致，仅底层存储对象不同。
 * @returns 实现 StorageAdapter 的对象；getItem 未命中或读取失败时返回 null，写方法失败时静默返回。
 * @see StorageAdapter
 * @see localStorageBackend
 */
export function sessionStorageBackend(): StorageAdapter {
  return {
    /**
     * 按键读取值。
     * @param key 键名，区分大小写。
     * @returns 命中时的字符串；未命中或读取抛错时返回 null。
     */
    getItem(key: string): string | null {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    /**
     * 写入或覆盖键值。
     * @param key 键名，区分大小写。
     * @param value 待写入字符串，直接存放不做序列化。
     */
    setItem(key: string, value: string): void {
      try {
        sessionStorage.setItem(key, value);
      } catch {
        /* 后端不可用时忽略操作。 */
      }
    },
    /**
     * 删除指定键。
     * @param key 待删除键名，区分大小写。
     */
    removeItem(key: string): void {
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* 后端不可用时忽略操作。 */
      }
    },
  };
}
