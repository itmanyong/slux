import type { Subscribable } from "@slux/core";
import { createMachine, type MachineConfig, type MachineSnapshot, type StateMachine } from "../src/index.js";

export function checkTypes(): void {
  type Context = { count: number };
  type Event = { type: "ADD"; amount: number } | { type: "STOP" };
  type State = "active" | "done";
  const config: MachineConfig<Context, Event, State> = {
    initial: "active",
    context: { count: 0 },
    states: {
      active: {
        on: {
          ADD: {
            guard: (context, event) => context.count + event.amount > 0,
            actions: (context, event) => ({
              count: context.count + event.amount,
            }),
          },
          STOP: {
            target: "done",
            actions: (_context, event) => {
              const type: "STOP" = event.type;
              // @ts-expect-error STOP 事件不包含 ADD 的载荷。
              void event.amount;
              void type;
            },
          },
        },
      },
      done: {},
    },
  };
  const machine: StateMachine<Context, Event, State> = createMachine(config);
  const source: Subscribable<MachineSnapshot<Context, State>> = machine;
  const result: MachineSnapshot<Context, State> = machine.send({
    type: "ADD",
    amount: 2,
  });
  const unsubscribe: () => void = source.subscribe((snapshot) => {
    const count: number = snapshot.context.count;
    const value: State = snapshot.value;
    void [count, value];
  });
  machine.can({ type: "STOP" });
  machine.matches("done");
  // @ts-expect-error 未定义的事件。
  machine.send({ type: "RESET" });
  // @ts-expect-error 缺少事件载荷。
  machine.send({ type: "ADD" });
  // @ts-expect-error 错误事件载荷类型。
  machine.can({ type: "ADD", amount: "2" });
  // @ts-expect-error 状态名称受限。
  machine.matches("missing");
  // @ts-expect-error 快照字段只读。
  result.value = "done";
  // @ts-expect-error 快照上下文引用只读。
  result.context = { count: 2 };
  const invalidTarget: MachineConfig<Context, Event, State> = {
    initial: "active",
    context: { count: 0 },
    states: {
      // @ts-expect-error 目标状态必须已定义。
      active: { on: { STOP: "missing" } },
      done: {},
    },
  };
  const inferred = createMachine({
    initial: "active",
    context: 0,
    states: { active: {} },
  });
  const numberContext: number = inferred.get().context;
  const functionContext = createMachine<() => number, { type: "SET" }, "active">({
    initial: "active",
    context: () => 1,
    states: { active: { on: { SET: { actions: () => () => 2 } } } },
  });
  const value: number = functionContext.get().context();
  void [result, unsubscribe, invalidTarget, numberContext, value];
}
