import type { Listener, MiddlewareAPI, SetFn } from "@slux/store";
import type { PERSIST_ERROR_CODE } from "./errors.js";
export type StorageAdapter = {
  getItem(key: string): string | null | Promise<string | null>;

  setItem(key: string, value: string): void | Promise<void>;

  removeItem(key: string): void | Promise<void>;
};

export type MemoryStorageAdapter = {
  clear(): void;
} & StorageAdapter;

export type PersistEnvelope<T> = {
  readonly state: T;
  readonly version: number;
};

export type PersistErrorCode = (typeof PERSIST_ERROR_CODE)[keyof typeof PERSIST_ERROR_CODE];

export type PersistError = {
  readonly code: PersistErrorCode;
  readonly message: string;
  readonly cause?: unknown;
};

export type PersistListener<T> = Listener<T>;

export type PersistMiddlewareAPI<T> = MiddlewareAPI<T>;

export type PersistSetFn<T> = SetFn<T>;

export type PersistOptions<T> = {
  readonly key: string;

  readonly storage?: StorageAdapter;

  readonly partialize?: (state: T) => Partial<T>;

  readonly merge?: (persisted: Partial<T>, current: T) => T;

  readonly version?: number;

  readonly migrate?: (persisted: Partial<T>, version: number) => Partial<T> | Promise<Partial<T>>;

  readonly serialize?: (value: PersistEnvelope<Partial<T>>) => string;

  readonly deserialize?: (value: string) => PersistEnvelope<Partial<T>>;

  readonly onError?: (error: PersistError) => void;

  readonly skipHydration?: boolean;
};

export type PersistMiddleware<T> = {
  readonly name: string;

  readonly init?: (api: PersistMiddlewareAPI<T>) => void;

  readonly onSet?: (api: PersistMiddlewareAPI<T>, next: PersistSetFn<T>, partial: Partial<T>) => void;

  readonly onDestroy?: (api: PersistMiddlewareAPI<T>) => void;

  rehydrate(): Promise<void>;

  hasHydrated(): boolean;

  onHydrate(callback: (state: T) => void): () => void;

  clearStorage(): Promise<void>;
};

export type CookieStorageOptions = {
  readonly maxAge?: number;
  readonly path?: string;
  readonly sameSite?: "strict" | "lax" | "none";
  readonly secure?: boolean;
  readonly domain?: string;
};

export type IndexedDBStorageOptions = {
  readonly dbName?: string;
  readonly storeName?: string;
  readonly dbVersion?: number;
};
