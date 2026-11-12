/**
 * @file 定义 storage 包对外的类型契约：存储适配器、持久化信封与错误、配置项、中间件接口及各后端配置。
 * 泛型 T 统一表示完整状态类型。
 */
import type { Listener, MiddlewareAPI, SetFn } from "@slux/store";
import type { PERSIST_ERROR_CODE } from "./errors.js";
/**
 * 存储后端的统一读写接口，persist 与各适配器均面向该契约编程。
 * 读写方法允许返回同步值或 Promise，使同步后端与异步后端可共用同一套调用方式。
 */
export type StorageAdapter = {
  /**
   * 按键读取值。
   * @param key 键名，区分大小写。
   * @returns 命中时的字符串；未命中返回 null，异步后端返回 Promise 包裹的同类结果。
   */
  getItem(key: string): string | null | Promise<string | null>;

  /**
   * 写入或覆盖键值。
   * @param key 键名，区分大小写。
   * @param value 待写入字符串，序列化由调用方负责。
   */
  setItem(key: string, value: string): void | Promise<void>;

  /**
   * 删除指定键。
   * @param key 待删除键名，区分大小写。
   */
  removeItem(key: string): void | Promise<void>;
};

/**
 * 在 StorageAdapter 之上额外要求同步清空能力的内存后端契约。
 */
export type MemoryStorageAdapter = {
  /** 清空当前实例内的全部键值。 */
  clear(): void;
} & StorageAdapter;

/**
 * 持久化时包裹状态快照与版本号的信封结构，写入存储前由 serialize 编码。
 */
export type PersistEnvelope<T> = {
  /** 被持久化的状态快照。 */
  readonly state: T;
  /** 数据版本号，供迁移判断使用。 */
  readonly version: number;
};

/** 由 PERSIST_ERROR_CODE 成员值派生的字符串字面量联合类型。 */
export type PersistErrorCode = (typeof PERSIST_ERROR_CODE)[keyof typeof PERSIST_ERROR_CODE];

/**
 * 持久化流程中通过 onError 上报的结构化错误对象。
 */
export type PersistError = {
  /** 错误分类码。 */
  readonly code: PersistErrorCode;
  /** 人类可读的错误描述。 */
  readonly message: string;
  /** 可选的原始异常/原因。 */
  readonly cause?: unknown;
};

/** 持久化层对 @slux/store 的 Listener<T> 的别名。 */
export type PersistListener<T> = Listener<T>;

/** 持久化层对 @slux/store 的 MiddlewareAPI<T> 的别名。 */
export type PersistMiddlewareAPI<T> = MiddlewareAPI<T>;

/** 持久化层对 @slux/store 的 SetFn<T> 的别名。 */
export type PersistSetFn<T> = SetFn<T>;

/**
 * persist 的配置项集合；未提供的项由 persist 决定默认行为。
 * partialize/merge/migrate 面向 Partial<T>，以便只持久化状态子集。
 */
export type PersistOptions<T> = {
  /** 存储键名。 */
  readonly key: string;

  /** 存储后端，缺省时由 persist 选择默认后端。 */
  readonly storage?: StorageAdapter;

  /** 状态裁剪函数：返回要落盘的状态子集。 */
  readonly partialize?: (state: T) => Partial<T>;

  /** 合并函数：将读回的持久化状态子集与当前完整状态合并。 */
  readonly merge?: (persisted: Partial<T>, current: T) => T;

  /** 期望的数据版本号。 */
  readonly version?: number;

  /**
   * 版本迁移函数：把旧版本持久化状态升级为当前版本。
   * @param persisted 读回的持久化状态子集。
   * @param version 读回数据所带的版本号。
   * @returns 迁移后的状态子集，可同步返回或返回 Promise。
   */
  readonly migrate?: (persisted: Partial<T>, version: number) => Partial<T> | Promise<Partial<T>>;

  /** 序列化函数：把 PersistEnvelope<Partial<T>> 转为写入后端的字符串。 */
  readonly serialize?: (value: PersistEnvelope<Partial<T>>) => string;

  /** 反序列化函数：把后端字符串还原为 PersistEnvelope<Partial<T>>。 */
  readonly deserialize?: (value: string) => PersistEnvelope<Partial<T>>;

  /** 错误回调，接收结构化 PersistError。 */
  readonly onError?: (error: PersistError) => void;

  /** 是否跳过初始化阶段的自动注水。 */
  readonly skipHydration?: boolean;
};

/**
 * persist 对外暴露的中间件控制接口，用于查询/触发注水、订阅注水完成与清空存储。
 */
export type PersistMiddleware<T> = {
  /** 中间件名称。 */
  readonly name: string;

  /** 可选的初始化钩子。 */
  readonly init?: (api: PersistMiddlewareAPI<T>) => void;

  /** 可选的写入钩子：next 为链式写入函数，partial 为本次写入的状态片段。 */
  readonly onSet?: (api: PersistMiddlewareAPI<T>, next: PersistSetFn<T>, partial: Partial<T>) => void;

  /** 可选的销毁钩子。 */
  readonly onDestroy?: (api: PersistMiddlewareAPI<T>) => void;

  /** 触发注水（从存储读回并合并到状态）。 */
  rehydrate(): Promise<void>;

  /** 查询是否已完成注水。 */
  hasHydrated(): boolean;

  /** 注册注水完成回调，返回注销函数。 */
  onHydrate(callback: (state: T) => void): () => void;

  /** 清空该持久化键对应的存储数据。 */
  clearStorage(): Promise<void>;
};

/**
 * cookieStorage 的可选配置，各字段对应一条 cookie 属性，未提供则不写入该属性。
 */
export type CookieStorageOptions = {
  /** 写入 max-age 属性的数值。 */
  readonly maxAge?: number;
  /** 写入 path 属性的路径，缺省时适配层回退到 "/"。 */
  readonly path?: string;
  /** 写入 samesite 属性，取值限定为 "strict" | "lax" | "none"。 */
  readonly sameSite?: "strict" | "lax" | "none";
  /** 是否写入 secure 属性。 */
  readonly secure?: boolean;
  /** 写入 domain 属性的域名。 */
  readonly domain?: string;
};

/**
 * indexedDBStorage 的可选配置。
 */
export type IndexedDBStorageOptions = {
  /** IndexedDB 数据库名。 */
  readonly dbName?: string;
  /** 对象存储（object store）名称。 */
  readonly storeName?: string;
  /** 数据库版本号。 */
  readonly dbVersion?: number;
};
