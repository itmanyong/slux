import type { DevtoolsMiddleware, DevtoolsOptions, DevtoolsConnection, ReduxDevtoolsExtension, MiddlewareAPI } from "./types.js";
import { InspectEventType } from "./types.js";
import { deriveActionName } from "./utils.js";
import { emitInspectEvent } from "./inspect.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getExtension(): ReduxDevtoolsExtension | undefined {
  const extension = (globalThis as Record<string, unknown>)["__REDUX_DEVTOOLS_EXTENSION__"];
  if (!isRecord(extension) || typeof extension["connect"] !== "function") return undefined;
  return extension as ReduxDevtoolsExtension;
}

function parseState(raw: unknown): Record<string, unknown> | undefined {
  if (typeof raw !== "string") return undefined;
  try {
    const state: unknown = JSON.parse(raw);
    return isRecord(state) ? state : undefined;
  } catch {
    return undefined;
  }
}

export function devtools<T>(options?: DevtoolsOptions): DevtoolsMiddleware<T> {
  if (options?.enabled === false) {
    return { name: "devtools", init() {}, onSet: (_api, next, partial) => next(partial), onDestroy() {} };
  }

  const storeName = options?.name ?? "Slux Store";
  let connection: DevtoolsConnection | undefined;
  let unsubscribe: (() => void) | undefined;
  let api: MiddlewareAPI<T> | undefined;
  let isTimeTraveling = false;

  function applyState(state: Record<string, unknown>): void {
    if (api === undefined) return;
    const current = api.getState() as Record<string, unknown>;
    const partial = { ...state };
    // 扩展只还原数据，序列化历史不能替换 Store 的操作函数。
    for (const key of Object.keys(current)) {
      if (typeof current[key] === "function") partial[key] = current[key];
    }
    isTimeTraveling = true;
    try {
      api.setState(partial as Partial<T>);
    } finally {
      isTimeTraveling = false;
    }
  }

  function handleMessage(message: unknown): void {
    if (api === undefined || !isRecord(message) || message["type"] !== "DISPATCH") return;
    const payload = message["payload"];
    if (!isRecord(payload)) return;

    switch (payload["type"]) {
      case "JUMP_TO_STATE":
      case "JUMP_TO_ACTION":
      case "ROLLBACK": {
        const state = parseState(message["state"] ?? payload["state"]);
        if (state === undefined) return;
        applyState(state);
        if (payload["type"] === "ROLLBACK") connection?.init(api.getState());
        break;
      }
      case "RESET": {
        applyState(api.getInitialState() as Record<string, unknown>);
        connection?.init(api.getState());
        break;
      }
      case "COMMIT":
        connection?.init(api.getState());
        break;
      case "IMPORT_STATE": {
        const history = payload["nextLiftedState"];
        if (!isRecord(history) || !Array.isArray(history["computedStates"])) return;
        const last: unknown = history["computedStates"].at(-1);
        if (!isRecord(last) || !isRecord(last["state"])) return;
        applyState(last["state"]);
        connection?.send(null, history);
        break;
      }
    }
  }

  return {
    name: "devtools",
    init(middlewareApi) {
      api = middlewareApi;
      connection = getExtension()?.connect({ name: storeName });
      connection?.init(api.getState());
      if (connection !== undefined) {
        const subscription = connection.subscribe(handleMessage);
        unsubscribe = typeof subscription === "function" ? subscription : () => subscription.unsubscribe();
      }
      emitInspectEvent({ type: InspectEventType.INIT, storeName, state: api.getState(), timestamp: Date.now() });
    },
    onSet(middlewareApi, next, partial) {
      if (isTimeTraveling) {
        next(partial);
        return;
      }
      const prevState = middlewareApi.getState();
      next(partial);
      const state = middlewareApi.getState();
      const action = (options?.actionName ?? deriveActionName)(partial as Record<string, unknown>);
      connection?.send({ type: action }, state);
      emitInspectEvent({ type: InspectEventType.SET, storeName, action, state, prevState, timestamp: Date.now() });
    },
    onDestroy(middlewareApi) {
      const disconnect = unsubscribe;
      api = undefined;
      connection = undefined;
      unsubscribe = undefined;
      try {
        disconnect?.();
      } finally {
        emitInspectEvent({ type: InspectEventType.DESTROY, storeName, state: middlewareApi.getState(), timestamp: Date.now() });
      }
    },
  };
}
