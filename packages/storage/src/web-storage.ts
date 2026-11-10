import type { StorageAdapter } from "./types.js";
export function localStorageBackend(): StorageAdapter {
  return {
    getItem(key: string): string | null {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string): void {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* 后端不可用时忽略操作。 */
      }
    },
    removeItem(key: string): void {
      try {
        localStorage.removeItem(key);
      } catch {
        /* 后端不可用时忽略操作。 */
      }
    },
  };
}

export function sessionStorageBackend(): StorageAdapter {
  return {
    getItem(key: string): string | null {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string): void {
      try {
        sessionStorage.setItem(key, value);
      } catch {
        /* 后端不可用时忽略操作。 */
      }
    },
    removeItem(key: string): void {
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* 后端不可用时忽略操作。 */
      }
    },
  };
}
