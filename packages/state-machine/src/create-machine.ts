/**
 * @file 状态机创建实现：把 MachineConfig 编译为迁移查找表，提供订阅、事件发送与销毁能力；signal 与批处理语义由 @slux/core 承担。
 */

import { batch, signal } from "@slux/core";
import type { MachineConfig, MachineSnapshot, MachineTransition, MachineTransitionConfig, StateMachine } from "./types.js";

/**
 * 把公开配置编译为「状态 → 事件 → 迁移列表」的两级查找表，并校验初始状态与所有目标状态的存在性。
 * @param config 状态机配置，读取其 initial 与 states。
 * @returns 两级查找表：外层键为状态、内层键为事件 type、值为只读迁移数组。
 * @throws 初始状态或任一 target 指向不存在的状态时抛出 Error（消息含状态名）。
 * @see createMachine
 */
function compileStates<Context, Event extends { type: string }, State extends string>(config: MachineConfig<Context, Event, State>) {
  if (!Object.hasOwn(config.states, config.initial)) throw new Error(`未定义初始状态：${config.initial}`);
  const states = new Map<State, Map<string, readonly MachineTransition<Context, Event, State>[]>>();
  for (const name of Object.keys(config.states) as State[]) {
    const events = new Map<string, readonly MachineTransition<Context, Event, State>[]>();
    for (const [type, configured] of Object.entries(config.states[name].on ?? {})) {
      // 单条配置统一成数组，使后续 map 无需区分标量与数组两种形态。
      const candidates = (Array.isArray(configured) ? configured : [configured]) as MachineTransitionConfig<Context, Event, State>[];
      events.set(
        type,
        candidates.map((candidate) => {
          // 字符串简写归一为 { target }；完整描述浅拷贝，保证编译结果与原配置引用隔离。
          const transition = typeof candidate === "string" ? { target: candidate } : { ...candidate };
          // 无 target 的自转移跳过校验。
          if (transition.target !== undefined && !Object.hasOwn(config.states, transition.target)) {
            throw new Error(`未定义目标状态：${transition.target}`);
          }
          if (Array.isArray(transition.actions)) transition.actions = [...transition.actions];
          return transition;
        }),
      );
    }
    states.set(name, events);
  }
  return states;
}

/**
 * 创建一个运行状态机实例：编译配置、建立状态 signal，并暴露 get/subscribe/send/matches/can/destroy。
 * @template Context 上下文数据类型。
 * @template Event 带 type 字段的事件联合。
 * @template State 字符串字面量状态联合。
 * @param config 状态机配置，合法性由 compileStates 校验。
 * @returns StateMachine 实例。
 * @remarks send 以 sending 标记阻止 guard/action 执行期间同一调用栈内的重入；订阅通知延迟到 batch 退出后，因此回调内可安全发送下一事件。destroy 后 send/can/subscribe 均降级为无操作。
 * @see compileStates
 */
export function createMachine<Context, Event extends { type: string }, State extends string>(
  config: MachineConfig<Context, Event, State>,
): StateMachine<Context, Event, State> {
  // 创建时一次性编译查找表，后续 send 只做查表。
  const states = compileStates(config);
  let current: MachineSnapshot<Context, State> = {
    value: config.initial,
    context: config.context,
  };
  const source = signal(current);
  const subscriptions = new Set<() => void>();
  let destroyed = false;
  // 重入保护仅防同一调用栈内嵌套 send，非多线程锁。
  let sending = false;

  /**
   * 在当前状态下选出第一条可用迁移（无 guard 或 guard 通过者）。
   * @param event 待匹配事件，用其 type 查表。
   * @returns 命中的迁移；无该事件或全部 guard 不通过时返回 undefined。
   */
  const selectTransition = (event: Event): MachineTransition<Context, Event, State> | undefined => {
    const candidates = states.get(current.value)?.get(event.type);
    return candidates?.find((transition) => transition.guard === undefined || transition.guard(current.context, event));
  };

  return {
    /** 读取当前快照。 */
    get: source.get,
    /**
     * 订阅状态快照变化。
     * @param callback 快照变化时的回调。
     * @returns 取消订阅函数；销毁后返回空操作函数。
     */
    subscribe(callback) {
      if (destroyed) return () => {};
      const unsubscribe = source.subscribe(callback);
      // dispose 同时撤销 signal 订阅并从集合移除自身，避免 destroy 时二次调用。
      const dispose = () => {
        unsubscribe();
        subscriptions.delete(dispose);
      };
      subscriptions.add(dispose);
      return dispose;
    },
    /**
     * 发送一个事件：选出迁移、依次执行动作、计算新状态，并在确有变化时更新 signal。
     * @param event 待发送事件。
     * @returns 处理后的快照；无可用迁移、状态与上下文均未变化或已销毁时返回原快照。
     * @throws 在 guard/action 执行期间重入 send 时抛出 Error；批内异常经 finally 复位 sending 后继续传播。
     */
    send(event) {
      if (destroyed) return current;
      if (sending) throw new Error("guard 和 action 执行期间不能再次发送事件");
      // batch 把订阅通知推迟到回调退出之后。
      return batch(() => {
        sending = true;
        try {
          const transition = selectTransition(event);
          if (transition === undefined) return current;
          let context = current.context;
          const actions = transition.actions;
          for (const action of typeof actions === "function" ? [actions] : (actions ?? [])) {
            const next = action(context, event);
            // 动作返回 void 时沿用当前 context。
            if (next !== undefined) context = next;
          }
          // target 缺省回退为当前状态（自转移）。
          const value = transition.target ?? current.value;
          if (destroyed || (value === current.value && Object.is(context, current.context))) return current;
          current = { value, context };
          source.set(current);
          return current;
        } finally {
          sending = false;
        }
      });
    },
    /**
     * 判断当前状态是否等于给定状态。
     * @param state 待比较状态。
     * @returns 相等返回 true，否则 false。
     */
    matches: (state) => source.get().value === state,
    /**
     * 判断某事件在当前状态下是否可触发迁移。
     * @param event 待检查事件。
     * @returns 存在可用迁移且未销毁时返回 true，否则 false。
     */
    can: (event) => !destroyed && selectTransition(event) !== undefined,
    /**
     * 销毁状态机并断开全部订阅；重复调用幂等，销毁后 send/can/subscribe 均降级。
     */
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const dispose of subscriptions) dispose();
    },
  };
}
