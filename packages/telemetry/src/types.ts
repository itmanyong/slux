/**
 * @file telemetry 包的类型契约：状态变更、初始化、订阅、错误上下文与中间件的数据结构。
 */

import type { Listener, MiddlewareAPI, SetFn } from "@slux/store";

/**
 * 一次状态变更的上报元数据，供 onStateChange 回调消费。
 * @template T Store 状态类型。
 */
export type StateChangeMetadata<T> = {
  /** 触发变更的 Store 名称。 */
  readonly name: string;

  /** 更新前的状态快照。 */
  readonly prevState: T;

  /** 更新后的状态快照。 */
  readonly nextState: T;

  /** 本次局部更新。 */
  readonly partial: Partial<T>;

  /** 变更发生时间（ISO 字符串）。 */
  readonly timestamp: string;

  /** 下游更新与 filter 的执行耗时（毫秒），不含上报回调自身。 */
  readonly durationMs: number;

  /** 累计变更次数，含被过滤与暂停期间的更新；销毁后归零。 */
  readonly changeCount: number;
};

/** 初始化事件的上报元数据，供 onInit 回调消费。 */
export type InitMetadata = {
  /** 触发初始化的 Store 名称。 */
  readonly name: string;

  /** 初始化发生时间（ISO 字符串）。 */
  readonly timestamp: string;
};

/** 订阅事件的上报元数据，供 onSubscribe 回调消费。 */
export type SubscriptionMetadata = {
  /** 触发订阅的 Store 名称。 */
  readonly name: string;

  /** 累计订阅次数，而非当前活跃订阅数。 */
  readonly totalSubscriptions: number;

  /** 订阅发生时间（ISO 字符串）。 */
  readonly timestamp: string;
};

/**
 * 错误上报上下文，供 onError 回调消费。
 * @template T Store 状态类型。
 */
export type ErrorContext<T> = {
  /** 捕获到的错误对象。 */
  readonly error: unknown;

  /** 错误来源标签，区分回调阶段。 */
  readonly source: "onStateChange" | "onInit" | "onSubscribe" | "filter";

  /** 相关状态快照；onSubscribe 错误场景无状态，为 undefined。 */
  readonly state: T | undefined;
};

/**
 * telemetry 中间件的配置对象，全部字段可选；未提供某回调时对应事件不产生上报。
 * @template T Store 状态类型。
 */
export type TelemetryOptions<T> = {
  /**
   * 状态变更回调。
   * @param metadata 本次变更的元数据。
   */
  readonly onStateChange?: (metadata: StateChangeMetadata<T>) => void;

  /**
   * 初始化回调。
   * @param initialState Store 的初始状态。
   * @param metadata 初始化事件的元数据。
   */
  readonly onInit?: (initialState: T, metadata: InitMetadata) => void;

  /**
   * 订阅回调。
   * @param metadata 订阅事件的元数据。
   */
  readonly onSubscribe?: (metadata: SubscriptionMetadata) => void;

  /**
   * 错误回调。
   * @param context 错误上下文。
   */
  readonly onError?: (context: ErrorContext<T>) => void;

  /**
   * 状态变更过滤器，返回 false 表示过滤掉该次变更、不上报。
   * @param prevState 变更前状态。
   * @param nextState 变更后状态。
   * @param partial 本次局部更新。
   * @returns 是否上报该次变更。
   */
  readonly filter?: (prevState: T, nextState: T, partial: Partial<T>) => boolean;
};

/**
 * telemetry 中间件契约，定义生命周期钩子及运行期开关控制，钩子由 Store 在对应时机同步调用。
 * @template T Store 状态类型。
 */
export type TelemetryMiddleware<T> = {
  /** 中间件名称，用于标识与去重。 */
  readonly name: string;

  /** 初始化钩子，在中间件装载时调用。 */
  readonly init: (api: MiddlewareAPI<T>) => void;

  /**
   * 状态更新钩子，在一次 set 时调用。
   * @param next 链中的下一个 set 函数。
   * @param partial 本次局部更新。
   */
  readonly onSet: (api: MiddlewareAPI<T>, next: SetFn<T>, partial: Partial<T>) => void;

  /**
   * 订阅钩子，在一次订阅时调用，可包装或替换监听器。
   * @returns 实际登记使用的监听器（可能是包装后的函数）。
   */
  readonly onSubscribe: (api: MiddlewareAPI<T>, listener: Listener<T>) => Listener<T>;

  /** 销毁钩子，在 Store/中间件拆卸时调用。 */
  readonly onDestroy: (api: MiddlewareAPI<T>) => void;

  /**
   * 运行期切换上报开关。
   * @param enabled true 启用上报、false 暂停上报；关闭期间是否累计计数由实现决定。
   */
  setEnabled(enabled: boolean): void;

  /**
   * 读取当前上报开关状态。
   * @returns true 表示启用，false 表示暂停。
   */
  isEnabled(): boolean;
};
