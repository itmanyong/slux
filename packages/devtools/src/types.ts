/**
 * @file devtools 包的类型契约：DevTools 连接、中间件、日志器与检查事件的数据结构。
 */

import type { MiddlewareAPI, SetFn } from "@slux/store";

/** 透传 store 层的 MiddlewareAPI 与 SetFn，使下游只需依赖 devtools/types 即可获得中间件契约。 */
export type { MiddlewareAPI, SetFn } from "@slux/store";

/**
 * Redux DevTools 扩展下发的消息结构，字段由外部扩展写入，消费方需按需判断存在性。
 */
export type DevtoolsMessage = {
  /** 顶层消息类别标识。 */
  readonly type: string;

  /** 消息负载。 */
  readonly payload: {
    /** 负载子类别标识。 */
    readonly type: string;

    /** 字符串形式的状态数据。 */
    readonly state?: string;

    /** 数值型动作标识。 */
    readonly actionId?: number;

    /** 时间线回放用的计算状态集合。 */
    readonly nextLiftedState?: {
      /** 计算状态列表。 */
      readonly computedStates: readonly { readonly state: unknown }[];
    };
  };

  /** 顶层字符串形式的状态数据，与 payload.state 相互独立。 */
  readonly state?: string;
};

/**
 * 与 DevTools 扩展建立的连接句柄，定义初始化、发送与订阅三种能力。
 */
export type DevtoolsConnection = {
  /** 以初始状态初始化连接时间线。 */
  init(state: unknown): void;

  /**
   * 发送一次动作及对应状态。
   * @param action 动作描述；null 表示不指定具体动作。
   * @param state 发送时的状态快照。
   */
  send(action: string | { type: string } | null, state: unknown): void;

  /**
   * 订阅扩展下发的消息。
   * @returns 取消订阅句柄：为无参函数或含 unsubscribe 方法的对象。
   */
  subscribe(listener: (message: DevtoolsMessage) => void): (() => void) | { unsubscribe(): void };
};

/** DevTools 扩展在宿主上暴露的入口，仅提供建立连接的能力。 */
export type ReduxDevtoolsExtension = {
  /**
   * 建立一个 DevtoolsConnection。
   * @param options 可选配置，name 用于标识连接。
   */
  connect(options?: { name?: string }): DevtoolsConnection;
};

/**
 * devtools 中间件的配置对象，全部字段可选。
 */
export type DevtoolsOptions = {
  /** 连接/实例名称，用于展示或区分多个实例。 */
  readonly name?: string;

  /** 是否启用 devtools 能力。 */
  readonly enabled?: boolean;

  /** 从局部状态对象推导 action 名称的函数；未提供时由实现采用默认命名。 */
  readonly actionName?: (partial: Record<string, unknown>) => string;
};

/**
 * 日志输出的最小接口抽象，使 logger 可对接不同宿主实现（如 console）而不依赖具体实现。
 */
export type LoggerInterface = {
  /** 输出一条日志。 */
  log(...args: unknown[]): void;

  /** 开启一个展开的日志分组。 */
  group(...args: unknown[]): void;

  /** 开启一个折叠的日志分组。 */
  groupCollapsed(...args: unknown[]): void;

  /** 结束最近一个日志分组。 */
  groupEnd(): void;
};

/**
 * logger 中间件的配置对象，全部字段可选。
 */
export type LoggerOptions = {
  /** 实例名称，用于日志前缀或分组标识。 */
  readonly name?: string;

  /** 日志分组是否默认折叠。 */
  readonly collapsed?: boolean;

  /** 是否输出状态差异。 */
  readonly diff?: boolean;

  /** 是否启用日志能力。 */
  readonly enabled?: boolean;

  /** 自定义日志输出实现；未提供时回退到 console。 */
  readonly logger?: LoggerInterface;

  /** 从局部状态对象推导 action 名称的函数；未提供时由实现采用默认命名。 */
  readonly actionName?: (partial: Record<string, unknown>) => string;
};

/**
 * devtools 中间件契约，定义初始化、状态更新与销毁三个生命周期钩子，由 Store 在对应时机同步调用。
 * @template T Store 状态类型。
 */
export type DevtoolsMiddleware<T> = {
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

  /** 销毁钩子，在 Store/中间件拆卸时调用。 */
  readonly onDestroy: (api: MiddlewareAPI<T>) => void;
};

/**
 * logger 中间件契约，仅定义名称与状态更新钩子，是 DevtoolsMiddleware 的精简形态。
 * @template T Store 状态类型。
 * @see DevtoolsMiddleware
 */
export type LoggerMiddleware<T> = {
  /** 中间件名称，用于标识与去重。 */
  readonly name: string;

  /**
   * 状态更新钩子，在一次 set 时调用。
   * @param api Store 中间件上下文。
   * @param next 链中的下一个 set 函数。
   * @param partial 本次局部更新。
   */
  readonly onSet: (api: MiddlewareAPI<T>, next: SetFn<T>, partial: Partial<T>) => void;
};

/**
 * 检查事件类型的常量枚举，配合 InspectEventTypeValue 得到联合类型。
 * @see InspectEventTypeValue
 */
export const InspectEventType = {
  /** 状态更新事件。 */
  SET: "set",
  /** 初始化事件。 */
  INIT: "init",
  /** 销毁事件。 */
  DESTROY: "destroy",
} as const;

/**
 * InspectEventType 所有值的联合类型，从常量对象的值推导，保证与常量定义同步。
 * @see InspectEventType
 */
export type InspectEventTypeValue = (typeof InspectEventType)[keyof typeof InspectEventType];

/**
 * 一次检查事件的完整数据契约，由 emitInspectEvent 派发给各检查器。
 * @see InspectCallback
 * @see emitInspectEvent
 */
export type InspectEvent = {
  /** 事件类型。 */
  readonly type: InspectEventTypeValue;

  /** 触发事件的 Store 名称，用于区分多个 Store 来源。 */
  readonly storeName: string;

  /** 触发事件的 action 名称；非 set 类事件可能缺失。 */
  readonly action?: string;

  /** 事件对应的当前状态快照。 */
  readonly state: unknown;

  /** 事件发生前的状态快照；初始化事件通常缺失。 */
  readonly prevState?: unknown;

  /** 事件时间戳（Date.now 毫秒值）。 */
  readonly timestamp: number;
};

/**
 * 检查事件回调类型，由 inspect 注册、emitInspectEvent 同步调用。
 * @see inspect
 * @see emitInspectEvent
 */
export type InspectCallback = (event: InspectEvent) => void;
