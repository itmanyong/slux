import type { Listener, MiddlewareAPI, SetFn } from "@slux/store";

export type StateChangeMetadata<T> = {
  readonly name: string;

  readonly prevState: T;

  readonly nextState: T;

  readonly partial: Partial<T>;

  readonly timestamp: string;

  /** 下游更新与 filter 执行耗时，不包含上报回调自身。 */
  readonly durationMs: number;

  /** 包含被过滤和暂停期间的更新；销毁后归零。 */
  readonly changeCount: number;
};

export type InitMetadata = {
  readonly name: string;

  readonly timestamp: string;
};

export type SubscriptionMetadata = {
  readonly name: string;

  /** 累计订阅次数，不是当前活跃订阅数。 */
  readonly totalSubscriptions: number;

  readonly timestamp: string;
};

export type ErrorContext<T> = {
  readonly error: unknown;

  readonly source: "onStateChange" | "onInit" | "onSubscribe" | "filter";

  /** onSubscribe 错误没有状态快照。 */
  readonly state: T | undefined;
};

export type TelemetryOptions<T> = {
  readonly onStateChange?: (metadata: StateChangeMetadata<T>) => void;

  readonly onInit?: (initialState: T, metadata: InitMetadata) => void;

  readonly onSubscribe?: (metadata: SubscriptionMetadata) => void;

  readonly onError?: (context: ErrorContext<T>) => void;

  readonly filter?: (prevState: T, nextState: T, partial: Partial<T>) => boolean;
};

export type TelemetryMiddleware<T> = {
  readonly name: string;

  readonly init: (api: MiddlewareAPI<T>) => void;

  readonly onSet: (api: MiddlewareAPI<T>, next: SetFn<T>, partial: Partial<T>) => void;

  readonly onSubscribe: (api: MiddlewareAPI<T>, listener: Listener<T>) => Listener<T>;

  readonly onDestroy: (api: MiddlewareAPI<T>) => void;

  setEnabled(enabled: boolean): void;

  isEnabled(): boolean;
};
