/**
 * @file devtools 中间件：把 Store 的状态变更桥接到 Redux DevTools 扩展，并支持时间旅行回放。
 * 扩展不可用或消息异常时静默降级，不影响 Store 主流程。
 */

import type { DevtoolsMiddleware, DevtoolsOptions, DevtoolsConnection, ReduxDevtoolsExtension, MiddlewareAPI } from "./types.js";
import { InspectEventType } from "./types.js";
import { deriveActionName } from "./utils.js";
import { emitInspectEvent } from "./inspect.js";

/**
 * 判断值是否为普通对象（非 null、非数组），作为外部消息与状态的类型窄化守卫。
 * @param value 任意待检测值。
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 从宿主全局对象探测 Redux DevTools 扩展入口。
 * 采用宽松探测而非直接依赖，扩展未安装或形态不符时返回 undefined 使中间件静默降级。
 */
function getExtension(): ReduxDevtoolsExtension | undefined {
  const extension = (globalThis as Record<string, unknown>)["__REDUX_DEVTOOLS_EXTENSION__"];
  if (!isRecord(extension) || typeof extension["connect"] !== "function") return undefined;
  return extension as ReduxDevtoolsExtension;
}

/**
 * 将字符串形式的状态解析为普通对象，用于回放外部传入的序列化状态。
 * 仅接受可解析且解析结果为普通对象的数据；解析异常被吞掉，统一降级为 undefined。
 * @param raw 待解析值，仅 string 类型会尝试解析。
 */
function parseState(raw: unknown): Record<string, unknown> | undefined {
  if (typeof raw !== "string") return undefined;
  try {
    const state: unknown = JSON.parse(raw);
    return isRecord(state) ? state : undefined;
  } catch {
    // 外部状态格式不可信，失败时按「无状态」处理而不中断回放。
    return undefined;
  }
}

/**
 * 创建一个 devtools 中间件实例，将 Store 状态变更上报到 DevTools 扩展并响应时间旅行消息。
 * 生命周期跟随 Store 的 init/onDestroy；enabled 为 false 时返回空实现。
 * @template T Store 状态类型。
 * @param options 可选配置：连接名、开关与自定义动作命名。
 * @returns DevtoolsMiddleware<T>，其 init/onSet/onDestroy 由 Store 在对应时机调用。
 * @see handleMessage 扩展消息处理
 * @see emitInspectEvent 检查事件派发
 */
export function devtools<T>(options?: DevtoolsOptions): DevtoolsMiddleware<T> {
  if (options?.enabled === false) {
    return { name: "devtools", init() {}, onSet: (_api, next, partial) => next(partial), onDestroy() {} };
  }

  const storeName = options?.name ?? "Slux Store";
  let connection: DevtoolsConnection | undefined;
  let unsubscribe: (() => void) | undefined;
  let api: MiddlewareAPI<T> | undefined;
  // 回放写入标记：区分「用户更新」与「时间旅行写入」，避免把回放结果再次上报形成回环。
  let isTimeTraveling = false;

  /**
   * 将一份外部状态写回 Store：保留现有操作函数，并在写入期间抑制回环上报。
   * @param state 待写入的数据状态，仅含数据字段。
   */
  function applyState(state: Record<string, unknown>): void {
    if (api === undefined) return;
    const current = api.getState() as Record<string, unknown>;
    const partial = { ...state };
    // 扩展只还原数据，函数字段需从当前状态回填，保证回放不会覆盖 Store 的操作方法。
    for (const key of Object.keys(current)) {
      if (typeof current[key] === "function") partial[key] = current[key];
    }
    isTimeTraveling = true;
    try {
      api.setState(partial as Partial<T>);
    } finally {
      // 即使 setState 抛错也复位标记，防止后续正常更新被误判为回放。
      isTimeTraveling = false;
    }
  }

  /**
   * 处理 DevTools 扩展下发的消息：按 payload.type 执行状态回放或连接刷新。
   * 仅处理 DISPATCH 类消息且 api 已就绪，其余静默忽略。
   * @param message 扩展消息，结构不可信，需逐层校验。
   * @see applyState
   */
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
        // ROLLBACK 在回放后重新初始化连接，使扩展侧时间线与当前状态对齐。
        if (payload["type"] === "ROLLBACK") connection?.init(api.getState());
        break;
      }
      case "RESET": {
        applyState(api.getInitialState() as Record<string, unknown>);
        connection?.init(api.getState());
        break;
      }
      case "COMMIT":
        // COMMIT 仅刷新扩展侧时间线，不改变 Store 状态。
        connection?.init(api.getState());
        break;
      case "IMPORT_STATE": {
        const history = payload["nextLiftedState"];
        if (!isRecord(history) || !Array.isArray(history["computedStates"])) return;
        const last: unknown = history["computedStates"].at(-1);
        if (!isRecord(last) || !isRecord(last["state"])) return;
        applyState(last["state"]);
        // 以 null 动作把整段历史回送扩展，保留导入来源信息。
        connection?.send(null, history);
        break;
      }
    }
  }

  return {
    /** 中间件名称，用于标识与去重。 */
    name: "devtools",
    /**
     * 生命周期 init：保存 api、建立并初始化连接、订阅消息，最后派发 INIT 检查事件。
     * @param middlewareApi Store 中间件上下文，存入闭包供其余钩子使用。
     */
    init(middlewareApi) {
      api = middlewareApi;
      connection = getExtension()?.connect({ name: storeName });
      connection?.init(api.getState());
      if (connection !== undefined) {
        const subscription = connection.subscribe(handleMessage);
        // 兼容两种订阅返回形态：函数为直接取消，对象则取其 unsubscribe 方法。
        unsubscribe = typeof subscription === "function" ? subscription : () => subscription.unsubscribe();
      }
      // 无论是否连上扩展都派发 INIT 检查事件，保证本地检查器可观测初始化。
      emitInspectEvent({ type: InspectEventType.INIT, storeName, state: api.getState(), timestamp: Date.now() });
    },
    /**
     * 生命周期 onSet：透传状态更新，并在非回放时向扩展与检查器上报变更。
     * @param middlewareApi Store 中间件上下文。
     * @param next 链中的下一个 set 函数。
     * @param partial 本次局部更新。
     */
    onSet(middlewareApi, next, partial) {
      // 回放期间仅透传，跳过上报，切断「回放→onSet→再上报」的回环。
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
    /**
     * 生命周期 onDestroy：断开订阅、清空闭包状态，并派发 DESTROY 检查事件。
     * @param middlewareApi Store 中间件上下文，用于取销毁时状态。
     */
    onDestroy(middlewareApi) {
      const disconnect = unsubscribe;
      api = undefined;
      connection = undefined;
      unsubscribe = undefined;
      try {
        disconnect?.();
      } finally {
        // 即使断开订阅抛错，DESTROY 事件也会派发，检查器状态不残留。
        emitInspectEvent({ type: InspectEventType.DESTROY, storeName, state: middlewareApi.getState(), timestamp: Date.now() });
      }
    },
  };
}
