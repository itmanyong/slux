import type { Accessor } from "solid-js";
import type { MachineSnapshot } from "@slux/state-machine";
import { createFluxStore } from "@slux/flux";
import { createMachine } from "@slux/state-machine";
import { fromObservable } from "@slux/rxjs";
import { Subject } from "rxjs";
import { useFluxStore } from "../src/flux.js";
import { useMachine } from "../src/state-machine.js";
import { useObservable } from "../src/rxjs.js";

export function checkParadigmTypes(): void {
  const flux = createFluxStore<number, { type: "ADD"; amount: number }>((state, action) => state + action.amount, 0);
  const machine = createMachine<{ count: number }, { type: "SET"; count: number }, "active">({
    initial: "active",
    context: { count: 0 },
    states: {
      active: {
        on: { SET: { actions: (_context, event) => ({ count: event.count }) } },
      },
    },
  });
  const subject = new Subject<() => number>();
  const observable = fromObservable(subject, () => 1);
  const fluxValue: Accessor<number> = useFluxStore(flux);
  const machineValue: Accessor<MachineSnapshot<{ count: number }, "active">> = useMachine(machine);
  const observableValue: Accessor<() => number> = useObservable(observable);
  // @ts-expect-error Flux 状态类型不能变为字符串。
  const invalidFlux: Accessor<string> = useFluxStore(flux);
  // @ts-expect-error 快照上下文类型不可变为字符串。
  const invalidMachine: Accessor<MachineSnapshot<string, "active">> = useMachine(machine);
  // @ts-expect-error 函数值不能变为函数调用结果。
  const invalidObservable: Accessor<number> = useObservable(observable);
  // @ts-expect-error 原始 RxJS Subject 必须先转换为 ObservableState。
  useObservable(subject);
  // @ts-expect-error action 载荷仍受限制。
  flux.dispatch({ type: "ADD", amount: "1" });
  // @ts-expect-error event 载荷仍受限制。
  machine.send({ type: "SET", count: "1" });
  void [fluxValue, machineValue, observableValue, invalidFlux, invalidMachine, invalidObservable];
}
