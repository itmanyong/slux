import type { MiddlewareAPI, SetFn } from "@slux/store";

export type { MiddlewareAPI, SetFn } from "@slux/store";

export type DevtoolsMessage = {
  readonly type: string;

  readonly payload: {
    readonly type: string;

    readonly state?: string;

    readonly actionId?: number;

    readonly nextLiftedState?: {
      readonly computedStates: readonly { readonly state: unknown }[];
    };
  };

  readonly state?: string;
};

export type DevtoolsConnection = {
  init(state: unknown): void;

  send(action: string | { type: string } | null, state: unknown): void;

  subscribe(listener: (message: DevtoolsMessage) => void): (() => void) | { unsubscribe(): void };
};

export type ReduxDevtoolsExtension = {
  connect(options?: { name?: string }): DevtoolsConnection;
};

export type DevtoolsOptions = {
  readonly name?: string;

  readonly enabled?: boolean;

  readonly actionName?: (partial: Record<string, unknown>) => string;
};

export type LoggerInterface = {
  log(...args: unknown[]): void;

  group(...args: unknown[]): void;

  groupCollapsed(...args: unknown[]): void;

  groupEnd(): void;
};

export type LoggerOptions = {
  readonly name?: string;

  readonly collapsed?: boolean;

  readonly diff?: boolean;

  readonly enabled?: boolean;

  readonly logger?: LoggerInterface;

  readonly actionName?: (partial: Record<string, unknown>) => string;
};

export type DevtoolsMiddleware<T> = {
  readonly name: string;

  readonly init: (api: MiddlewareAPI<T>) => void;

  readonly onSet: (api: MiddlewareAPI<T>, next: SetFn<T>, partial: Partial<T>) => void;

  readonly onDestroy: (api: MiddlewareAPI<T>) => void;
};

export type LoggerMiddleware<T> = {
  readonly name: string;

  readonly onSet: (api: MiddlewareAPI<T>, next: SetFn<T>, partial: Partial<T>) => void;
};

export const InspectEventType = {
  SET: "set",
  INIT: "init",
  DESTROY: "destroy",
} as const;

export type InspectEventTypeValue = (typeof InspectEventType)[keyof typeof InspectEventType];

export type InspectEvent = {
  readonly type: InspectEventTypeValue;

  readonly storeName: string;

  readonly action?: string;

  readonly state: unknown;

  readonly prevState?: unknown;

  readonly timestamp: number;
};

export type InspectCallback = (event: InspectEvent) => void;
