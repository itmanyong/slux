/**
 * @file 定义 store 包的对外类型契约；只声明类型，无运行时实现。
 */
import type { Subscribable } from "@slux/core";

/**
 * 更新状态的函数类型：接受状态片段，或由当前状态计算片段的 updater。
 */
export type SetStateFn<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;

/** 读取当前完整状态的函数类型。 */
export type GetStateFn<T> = () => T;

/**
 * 状态创建函数类型：接收 set/get 并返回 store 的初始状态 T。
 */
export type StateCreator<T> = (set: SetStateFn<T>, get: GetStateFn<T>) => T;

/**
 * 状态变化订阅回调：state 为变化后状态，prevState 为变化前状态。
 */
export type Listener<T> = (state: T, prevState: T) => void;

/**
 * 中间件写入链中的写入函数：不接受函数式 updater，只接收已解析的状态片段。
 * @param partial 已解析的状态片段。
 * @see SetStateFn
 */
export type SetFn<T> = (partial: Partial<T>) => void;

/**
 * 传给中间件钩子的 API，封装状态读写与订阅能力，由 Store 实现并注入。
 */
export type MiddlewareAPI<T> = {
  /** 读取当前完整状态。 */
  getState(): T;
  /** 更新状态，语义同 SetStateFn<T>。 */
  setState: SetStateFn<T>;
  /** 读取初始状态。 */
  getInitialState(): T;
  /** 注册监听器，返回注销句柄。 */
  subscribe(listener: Listener<T>): () => void;
};

/**
 * 中间件契约：除 name 外各钩子均可选，Store 按各自时机调用已提供的钩子。
 */
export type Middleware<T> = {
  /** 中间件名称，用于标识。 */
  readonly name: string;
  /** 初始化钩子，在 Store 初始化完成、api 可用时调用。 */
  readonly init?: (api: MiddlewareAPI<T>) => void;
  /** 写入钩子：next 为链式写入函数，partial 为本次写入的状态片段。 */
  readonly onSet?: (api: MiddlewareAPI<T>, next: SetFn<T>, partial: Partial<T>) => void;
  /** 兼容接口，Store 不调用；保留签名以维持类型兼容。 */
  readonly onGet?: (api: MiddlewareAPI<T>, key: keyof T) => void;
  /** 订阅钩子：返回可能替换后的监听器。 */
  readonly onSubscribe?: (api: MiddlewareAPI<T>, listener: Listener<T>) => Listener<T>;
  /** 销毁钩子。 */
  readonly onDestroy?: (api: MiddlewareAPI<T>) => void;
};

/**
 * 创建 Store 时的可选配置。
 */
export type StoreOptions<T> = {
  /** 中间件数组；缺省时由 createStore 决定行为。 */
  readonly middleware?: readonly Middleware<T>[];
};

/**
 * Store 对外暴露的完整 API：在 Subscribable<T> 与 MiddlewareAPI<T> 之上补充 destroy。
 */
export type StoreApi<T> = Omit<Subscribable<T>, "subscribe"> &
  MiddlewareAPI<T> & {
    /** 销毁 Store 实例。 */
    destroy(): void;
  };
