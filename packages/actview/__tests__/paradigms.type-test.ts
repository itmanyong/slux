import { useFluxStore } from "../src/flux.js";
import { useMachine } from "../src/state-machine.js";
import { useObservable } from "../src/rxjs.js";
import { sources } from "./paradigm-sources.js";

export function checkParadigmTypes(): void {
  const source = sources();
  const flux = useFluxStore(source.flux);
  const machine = useMachine(source.machine);
  const observable = useObservable(source.observable);
  void (flux.value satisfies number);
  void (machine.value.value satisfies "idle" | "done");
  void (machine.value.context.count satisfies number);
  void (observable.value satisfies number);
  source.flux.dispatch({ type: "increment" });
  source.machine.send({ type: "GO" });
  // @ts-expect-error Flux 绑定不修改 action 类型。
  source.flux.dispatch({ type: "wrong" });
  // @ts-expect-error 状态机绑定不修改 event 类型。
  source.machine.send({ type: "wrong" });
  // @ts-expect-error 只接收具有生命周期的桥接实例。
  useObservable(source.flux);
  // @ts-expect-error 返回快照的状态名只读。
  machine.value.value = "done";
  // @ts-expect-error 框架返回容器只读。
  observable.value = 2;
  source.dispose();
}
