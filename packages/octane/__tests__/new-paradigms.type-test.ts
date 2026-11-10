import type { FluxStore } from "@slux/flux";
import type { MachineSnapshot, StateMachine } from "@slux/state-machine";
import type { ObservableState } from "@slux/rxjs";
import type { Subscribable } from "@slux/core";
import { useFluxStore } from "../src/flux.js";
import { useMachine } from "../src/state-machine.js";
import { useObservable } from "../src/rxjs.js";

export function checkTypes(
  flux: FluxStore<number, { type: "add"; amount: number }>,
  machine: StateMachine<{ count: number }, { type: "advance" }, "idle" | "ready">,
  observable: ObservableState<string>,
  plain: Subscribable<number>,
) {
  const value: number = useFluxStore(flux, Symbol.for("flux"));
  const snapshot: MachineSnapshot<{ count: number }, "idle" | "ready"> = useMachine(machine, Symbol.for("machine"));
  const text: string = useObservable(observable, Symbol.for("observable"));
  // @ts-expect-error 完整状态不是写入 tuple。
  const pair: [number, (value: number) => void] = useFluxStore(flux);
  // @ts-expect-error 状态机上下文保留具体类型。
  const incorrect: string = useMachine(machine).context.count;
  // @ts-expect-error ObservableState 的值类型不能退化为 any。
  const number: number = useObservable(observable);
  // @ts-expect-error 普通 Subscribable 不是 FluxStore。
  useFluxStore(plain);
  // @ts-expect-error 普通 Subscribable 不是 ObservableState。
  useObservable(plain);
  // @ts-expect-error 写入仍遵循原 action 类型。
  flux.dispatch({ type: "add", amount: "wrong" });
  // @ts-expect-error 状态机事件不能任意改变。
  machine.send({ type: "missing" });
  return { value, snapshot, text, pair, incorrect, number };
}
