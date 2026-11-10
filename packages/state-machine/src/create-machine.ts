import { batch, signal } from "@slux/core";
import type { MachineConfig, MachineSnapshot, MachineTransition, MachineTransitionConfig, StateMachine } from "./types.js";

function compileStates<Context, Event extends { type: string }, State extends string>(config: MachineConfig<Context, Event, State>) {
  if (!Object.hasOwn(config.states, config.initial)) throw new Error(`未定义初始状态：${config.initial}`);
  const states = new Map<State, Map<string, readonly MachineTransition<Context, Event, State>[]>>();
  for (const name of Object.keys(config.states) as State[]) {
    const events = new Map<string, readonly MachineTransition<Context, Event, State>[]>();
    for (const [type, configured] of Object.entries(config.states[name].on ?? {})) {
      // 事件键与回调的判别联合关联已由公开配置类型约束，运行时按同一个键分派。
      const candidates = (Array.isArray(configured) ? configured : [configured]) as MachineTransitionConfig<Context, Event, State>[];
      events.set(
        type,
        candidates.map((candidate) => {
          const transition = typeof candidate === "string" ? { target: candidate } : { ...candidate };
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

export function createMachine<Context, Event extends { type: string }, State extends string>(
  config: MachineConfig<Context, Event, State>,
): StateMachine<Context, Event, State> {
  const states = compileStates(config);
  let current: MachineSnapshot<Context, State> = {
    value: config.initial,
    context: config.context,
  };
  const source = signal(current);
  const subscriptions = new Set<() => void>();
  let destroyed = false;
  let sending = false;

  const selectTransition = (event: Event): MachineTransition<Context, Event, State> | undefined => {
    const candidates = states.get(current.value)?.get(event.type);
    return candidates?.find((transition) => transition.guard === undefined || transition.guard(current.context, event));
  };

  return {
    get: source.get,
    subscribe(callback) {
      if (destroyed) return () => {};
      const unsubscribe = source.subscribe(callback);
      const dispose = () => {
        unsubscribe();
        subscriptions.delete(dispose);
      };
      subscriptions.add(dispose);
      return dispose;
    },
    send(event) {
      if (destroyed) return current;
      if (sending) throw new Error("guard 和 action 执行期间不能再次发送事件");
      return batch(() => {
        sending = true;
        try {
          const transition = selectTransition(event);
          if (transition === undefined) return current;
          let context = current.context;
          const actions = transition.actions;
          for (const action of typeof actions === "function" ? [actions] : (actions ?? [])) {
            const next = action(context, event);
            if (next !== undefined) context = next;
          }
          const value = transition.target ?? current.value;
          if (destroyed || (value === current.value && Object.is(context, current.context))) return current;
          current = { value, context };
          source.set(current);
          return current;
        } finally {
          // 外层 batch 退出后才通知订阅者，因此监听回调可以发送下一事件。
          sending = false;
        }
      });
    },
    matches: (state) => source.get().value === state,
    can: (event) => !destroyed && selectTransition(event) !== undefined,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const dispose of subscriptions) dispose();
    },
  };
}
