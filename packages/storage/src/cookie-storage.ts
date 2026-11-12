/**
 * @file 提供基于 document.cookie 的存储适配器，把键值读写映射为 cookie 字符串的编码、拼接与解析。
 * 读写过程中的异常一律吞掉，不向调用方传播。
 */

import type { StorageAdapter, CookieStorageOptions } from "./types.js";

/**
 * 创建一个以 document.cookie 为后端的同步存储适配器。
 * 可选配置在工厂调用时固化到闭包。
 * @param options 可选配置；未提供的属性不写入 cookie，path 缺省为 "/"。
 * @returns 实现 StorageAdapter 的对象；getItem 未命中或读取失败时返回 null，写方法失败时静默返回。
 * @see StorageAdapter
 * @see CookieStorageOptions
 */
export function cookieStorage(options?: CookieStorageOptions): StorageAdapter {
  const maxAge = options?.maxAge;
  const path = options?.path ?? "/";
  const sameSite = options?.sameSite;
  const secure = options?.secure;
  const domain = options?.domain;

  return {
    /**
     * 读取指定键的值。
     * @param key 键名，查找前做 URI 编码以匹配写入时的形式。
     * @returns 命中时返回解码后的字符串；未命中或解析失败时返回 null。
     */
    getItem(key: string): string | null {
      try {
        const cookies = document.cookie.split(";");
        const encodedKey = encodeURIComponent(key);
        for (const cookie of cookies) {
          const trimmed = cookie.trim();
          // 用「编码键=」前缀匹配而非整体相等，排除值恰含该前缀的其它 cookie。
          if (trimmed.startsWith(encodedKey + "=")) {
            return decodeURIComponent(trimmed.slice(encodedKey.length + 1));
          }
        }
        return null;
      } catch {
        return null;
      }
    },
    /**
     * 将键值对写入 document.cookie。
     * @param key 键名，写入前做 URI 编码。
     * @param value 待写入字符串，写入前做 URI 编码。
     */
    setItem(key: string, value: string): void {
      try {
        let cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        cookie += `; path=${path}`;
        if (maxAge !== undefined) cookie += `; max-age=${String(maxAge)}`;
        if (sameSite !== undefined) cookie += `; samesite=${sameSite}`;
        if (secure === true) cookie += "; secure"; // 仅显式为 true 时写入，避免 truthy 值误触发。
        if (domain !== undefined) cookie += `; domain=${domain}`;
        document.cookie = cookie;
      } catch {
        // 吞掉异常，使写入失败不影响调用方主流程。
      }
    },
    /**
     * 删除指定键：写入一条 max-age=0 的空值同名 cookie 使其立即过期。
     * @param key 待删除键名，写入前做 URI 编码。
     * @remarks path/domain/secure/samesite 须与写入时一致，否则命中不到同一条 cookie。
     */
    removeItem(key: string): void {
      try {
        document.cookie = `${encodeURIComponent(key)}=; max-age=0; path=${path}${domain === undefined ? "" : `; domain=${domain}`}${secure === true ? "; secure" : ""}${sameSite === undefined ? "" : `; samesite=${sameSite}`}`;
      } catch {
        // 吞掉异常，使删除失败不影响调用方主流程。
      }
    },
  };
}
