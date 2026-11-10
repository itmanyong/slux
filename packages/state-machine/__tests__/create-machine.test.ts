import { batch, computed, effect, signal } from "@slux/core";
import { describe, expect, it } from "rstack/test";
import { createMachine, type MachineConfig, type MachineSnapshot, type StateMachine } from "../src/index.js";

type Context = { count: number };
type Event = { type: "ADD"; amount: number } | { type: "STOP" } | { type: "UNKNOWN" };
type State = "active" | "done";

describe("createMachine", () => {
  it("同步转换、顺序 action 接收前一步上下文，旧快照保持不变", () => {
    const original = { count: 0 };
    const observed: number[] = [];
    const machine = createMachine<Context, Event, State>({
      initial: "active",
      context: original,
      states: {
        active: {
          on: {
            ADD: {
              actions: [
                (context, event) => ({ count: context.count + event.amount }),
                (context) => {
                  observed.push(context.count);
                },
                (context) => ({ count: context.count * 2 }),
              ],
            },
            STOP: "done",
          },
        },
        done: {},
      },
    });
    const initial = machine.get();
    expect(machine.get()).toBe(initial);
    expect(machine.send({ type: "ADD", amount: 3 })).toEqual({
      value: "active",
      context: { count: 6 },
    });
    expect(observed).toEqual([3]);
    expect(initial.context).toBe(original);
    expect(original).toEqual({ count: 0 });
    machine.send({ type: "STOP" });
    expect(machine.matches("done")).toBe(true);
  });

  it("按顺序选择第一个通过 guard 的候选，can 不执行 action", () => {
    const actions: string[] = [];
    const machine = createMachine<Context, Event, State>({
      initial: "active",
      context: { count: 1 },
      states: {
        active: {
          on: {
            ADD: [
              {
                guard: (_context, event) => event.amount < 0,
                actions: () => {
                  actions.push("negative");
                },
              },
              {
                guard: (context, event) => context.count + event.amount > 2,
                target: "done",
                actions: () => {
                  actions.push("selected");
                },
              },
              {
                actions: () => {
                  actions.push("fallback");
                },
              },
            ],
          },
        },
        done: {},
      },
    });
    expect(machine.can({ type: "ADD", amount: 2 })).toBe(true);
    expect(actions).toEqual([]);
    machine.send({ type: "ADD", amount: 2 });
    expect(actions).toEqual(["selected"]);
    expect(machine.matches("done")).toBe(true);
    expect(machine.can({ type: "ADD", amount: 2 })).toBe(false);
  });

  it("缺失事件、guard 拒绝及无变化转换保持快照引用且不通知", () => {
    const machine = createMachine<Context, Event, State>({
      initial: "active",
      context: { count: 0 },
      states: {
        active: {
          on: { ADD: { guard: () => false, target: "done" }, STOP: "active" },
        },
        done: {},
      },
    });
    const seen: unknown[] = [];
    machine.subscribe((snapshot) => seen.push(snapshot));
    const initial = machine.get();
    expect(machine.send({ type: "UNKNOWN" })).toBe(initial);
    expect(machine.send({ type: "ADD", amount: 1 })).toBe(initial);
    expect(machine.send({ type: "STOP" })).toBe(initial);
    expect(machine.can({ type: "ADD", amount: 1 })).toBe(false);
    expect(seen).toEqual([]);
  });

  it("与 core computed/effect 联动，外层 batch 合并通知且写入立即可读", () => {
    const machine = createMachine<number, { type: "ADD" }, "active">({
      initial: "active",
      context: 0,
      states: {
        active: { on: { ADD: { actions: (context) => context + 1 } } },
      },
    });
    const doubled = computed(() => machine.get().context * 2);
    const effects: number[] = [];
    const notifications: number[] = [];
    const dispose = effect(() => {
      effects.push(doubled.get());
    });
    machine.subscribe((snapshot) => notifications.push(snapshot.context));
    batch(() => {
      machine.send({ type: "ADD" });
      expect(machine.get().context).toBe(1);
      machine.send({ type: "ADD" });
      expect(doubled.get()).toBe(4);
      expect(notifications).toEqual([]);
    });
    expect(notifications).toEqual([2]);
    expect(effects).toEqual([0, 4]);
    dispose();
  });

  it("guard/action 抛错不提交，action 外部副作用保留且后续 send 可用", () => {
    let shouldThrow = true;
    const external: number[] = [];
    const machine = createMachine<Context, Event, State>({
      initial: "active",
      context: { count: 0 },
      states: {
        active: {
          on: {
            STOP: {
              guard: () => {
                throw new Error("guard failure");
              },
              target: "done",
            },
            ADD: {
              target: "done",
              actions: [
                (_context, event) => ({ count: event.amount }),
                (context) => {
                  external.push(context.count);
                  if (shouldThrow) throw new Error("action failure");
                },
              ],
            },
          },
        },
        done: {},
      },
    });
    const initial = machine.get();
    expect(() => machine.send({ type: "STOP" })).toThrow("guard failure");
    expect(() => machine.can({ type: "STOP" })).toThrow("guard failure");
    expect(() => machine.send({ type: "ADD", amount: 2 })).toThrow("action failure");
    expect(machine.get()).toBe(initial);
    expect(external).toEqual([2]);
    shouldThrow = false;
    expect(machine.send({ type: "ADD", amount: 3 })).toEqual({
      value: "done",
      context: { count: 3 },
    });
  });

  it("action 内禁止嵌套 send，订阅回调可以再次 send", () => {
    let reenter = true;
    const machine: StateMachine<number, { type: "ADD" }, "active"> = createMachine({
      initial: "active",
      context: 0,
      states: {
        active: {
          on: {
            ADD: {
              actions: (context) => {
                if (reenter) machine.send({ type: "ADD" });
                return context + 1;
              },
            },
          },
        },
      },
    });
    expect(() => machine.send({ type: "ADD" })).toThrow();
    expect(machine.get().context).toBe(0);
    reenter = false;
    const seen: number[] = [];
    machine.subscribe((snapshot) => {
      seen.push(snapshot.context);
      if (snapshot.context === 1) machine.send({ type: "ADD" });
    });
    machine.send({ type: "ADD" });
    expect(seen).toEqual([1, 2]);
    expect(machine.get().context).toBe(2);
  });

  it("destroy 幂等，取消排队通知、释放订阅并停止发送，仍可读最终状态", () => {
    const machine = createMachine<number, { type: "ADD" }, "active">({
      initial: "active",
      context: 0,
      states: {
        active: { on: { ADD: { actions: (context) => context + 1 } } },
      },
    });
    const seen: unknown[] = [];
    machine.subscribe((snapshot) => seen.push(snapshot));
    batch(() => {
      machine.send({ type: "ADD" });
      machine.destroy();
      machine.destroy();
    });
    const final = machine.get();
    const unsubscribe = machine.subscribe((snapshot) => seen.push(snapshot));
    expect(machine.send({ type: "ADD" })).toBe(final);
    expect(machine.can({ type: "ADD" })).toBe(false);
    expect(machine.matches("active")).toBe(true);
    expect(final.context).toBe(1);
    expect(seen).toEqual([]);
    unsubscribe();
  });

  it("允许函数上下文和原始值，action 的 undefined 返回表示保持上下文", () => {
    const first = () => 1;
    const second = () => 2;
    const machine = createMachine<() => number, { type: "SET" }, "active">({
      initial: "active",
      context: first,
      states: {
        active: { on: { SET: { actions: [() => second, () => undefined] } } },
      },
    });
    machine.send({ type: "SET" });
    expect(machine.get().context).toBe(second);
    expect(machine.get().context()).toBe(2);
  });

  it("构造时拒绝未定义的初态与所有候选中的非法 target", () => {
    const invalid = {
      initial: "missing",
      context: 0,
      states: { active: {} },
    } as unknown as MachineConfig<number, Event, State>;
    expect(() => createMachine(invalid)).toThrow();
    const invalidTarget = {
      initial: "active",
      context: 0,
      states: {
        active: { on: { STOP: [{ guard: () => false, target: "missing" }] } },
      },
    } as unknown as MachineConfig<number, Event, State>;
    expect(() => createMachine(invalidTarget)).toThrow();
  });

  it("取消订阅后不再收到转换通知", () => {
    const machine = createMachine<number, { type: "STOP" }, State>({
      initial: "active",
      context: 0,
      states: { active: { on: { STOP: "done" } }, done: {} },
    });
    const seen: MachineSnapshot<number, State>[] = [];
    const unsubscribe = machine.subscribe((snapshot) => seen.push(snapshot));
    unsubscribe();
    unsubscribe();
    machine.send({ type: "STOP" });
    expect(seen).toEqual([]);
  });

  it("effect 中发送事件不意外订阅机器状态", () => {
    const source = signal(0);
    const machine = createMachine<number, { type: "ADD" }, "active">({
      initial: "active",
      context: 0,
      states: {
        active: { on: { ADD: { actions: (context) => context + 1 } } },
      },
    });
    let runs = 0;
    const dispose = effect(() => {
      source.get();
      if (++runs > 5) throw new Error("意外订阅状态机");
      machine.send({ type: "ADD" });
    });
    expect(runs).toBe(1);
    machine.send({ type: "ADD" });
    expect(runs).toBe(1);
    source.set(1);
    expect(runs).toBe(2);
    expect(machine.get().context).toBe(3);
    dispose();
  });
});
