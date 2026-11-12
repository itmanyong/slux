/**
 * @file 提供基于内存 Map 的键值存储适配器，数据仅存活于当前实例内、不落盘。
 */

import type { MemoryStorageAdapter } from "./types.js";

/**
 * 创建一个内存存储适配器实例，每次调用返回彼此独立、互不共享数据的对象。
 * 用闭包持有 Map 而非模块级单例，避免多个持久化实例之间的键值相互覆盖。
 * @returns 实现 MemoryStorageAdapter 的对象；getItem 未命中时返回 null。
 * @see MemoryStorageAdapter
 */
export function memoryStorage(): MemoryStorageAdapter {
  const store = new Map<string, string>();

  return {
    /**
     * 按键读取字符串值。
     * @param key 键名，区分大小写。
     * @returns 命中时返回所存字符串；未命中时返回 null。
     */
    getItem(key: string): string | null {
      return store.get(key) ?? null;
    },
    /**
     * 写入或覆盖指定键的值。
     * @param key 键名，已存在时覆盖旧值。
     * @param value 待写入的字符串。
     */
    setItem(key: string, value: string): void {
      store.set(key, value);
    },
    /**
     * 删除指定键；键不存在时为空操作。
     * @param key 待删除的键名。
     */
    removeItem(key: string): void {
      store.delete(key);
    },
    /** 清空当前实例内的全部键值。 */
    clear(): void {
      store.clear();
    },
  };
}
