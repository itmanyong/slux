import type { Subscribable } from "@slux/core";

export type SetStateFn<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;

export type GetStateFn<T> = () => T;

export type StateCreator<T> = (set: SetStateFn<T>, get: GetStateFn<T>) => T;

export type Listener<T> = (state: T, prevState: T) => void;

/** updater 在进入中间件之前求值，next 只接收已解析的部分状态。 */
export type SetFn<T> = (partial: Partial<T>) => void;

export type MiddlewareAPI<T> = {
  getState(): T;
  setState: SetStateFn<T>;
  getInitialState(): T;
  subscribe(listener: Listener<T>): () => void;
};

export type Middleware<T> = {
  readonly name: string;
  readonly init?: (api: MiddlewareAPI<T>) => void;
  readonly onSet?: (api: MiddlewareAPI<T>, next: SetFn<T>, partial: Partial<T>) => void;
  /** 保留兼容接口；Store 不拦截属性读取，不调用此钩子。 */
  readonly onGet?: (api: MiddlewareAPI<T>, key: keyof T) => void;
  readonly onSubscribe?: (api: MiddlewareAPI<T>, listener: Listener<T>) => Listener<T>;
  readonly onDestroy?: (api: MiddlewareAPI<T>) => void;
};

export type StoreOptions<T> = {
  readonly middleware?: readonly Middleware<T>[];
};

export type StoreApi<T> = Omit<Subscribable<T>, "subscribe"> &
  MiddlewareAPI<T> & {
    destroy(): void;
  };
