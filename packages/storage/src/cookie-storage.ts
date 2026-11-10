import type { StorageAdapter, CookieStorageOptions } from "./types.js";
export function cookieStorage(options?: CookieStorageOptions): StorageAdapter {
  const maxAge = options?.maxAge;
  const path = options?.path ?? "/";
  const sameSite = options?.sameSite;
  const secure = options?.secure;
  const domain = options?.domain;

  return {
    getItem(key: string): string | null {
      try {
        const cookies = document.cookie.split(";");
        const encodedKey = encodeURIComponent(key);
        for (const cookie of cookies) {
          const trimmed = cookie.trim();
          if (trimmed.startsWith(encodedKey + "=")) {
            return decodeURIComponent(trimmed.slice(encodedKey.length + 1));
          }
        }
        return null;
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string): void {
      try {
        let cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        cookie += `; path=${path}`;
        if (maxAge !== undefined) cookie += `; max-age=${String(maxAge)}`;
        if (sameSite !== undefined) cookie += `; samesite=${sameSite}`;
        if (secure === true) cookie += "; secure";
        if (domain !== undefined) cookie += `; domain=${domain}`;
        document.cookie = cookie;
      } catch {
        /* 后端不可用时忽略操作。 */
      }
    },
    removeItem(key: string): void {
      try {
        document.cookie = `${encodeURIComponent(key)}=; max-age=0; path=${path}${domain === undefined ? "" : `; domain=${domain}`}${secure === true ? "; secure" : ""}${sameSite === undefined ? "" : `; samesite=${sameSite}`}`;
      } catch {
        /* 后端不可用时忽略操作。 */
      }
    },
  };
}
