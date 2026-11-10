import { createElement as h } from "inferno-create-element";
import type { FluxStore } from "@slux/flux";
import type { StateMachine } from "@slux/state-machine";
import type { ObservableState } from "@slux/rxjs";
import type { Subscribable } from "@slux/core";
import { FluxValue, type FluxValueProps } from "../src/flux.js";
import { MachineValue } from "../src/state-machine.js";
import { ObservableValue, type ObservableValueProps } from "../src/rxjs.js";

export function checkTypes(
  flux: FluxStore<number, { type: "add" }>,
  machine: StateMachine<{ count: number }, { type: "advance" }, "idle" | "ready">,
  observable: ObservableState<string>,
  plain: Subscribable<number>,
) {
  h(FluxValue<number, { type: "add" }>, {
    source: flux,
    children: (value) => {
      const correct: number = value;
      // @ts-expect-error FluxValue 保留状态类型。
      const incorrect: string = value;
      return String(correct) + incorrect;
    },
  });
  h(MachineValue<{ count: number }, { type: "advance" }, "idle" | "ready">, {
    source: machine,
    children: (value) => {
      const count: number = value.context.count;
      const state: "idle" | "ready" = value.value;
      // @ts-expect-error StateMachine 的状态不是任意字符串。
      const wrong: "missing" = value.value;
      return String(count) + state + wrong;
    },
  });
  h(ObservableValue<string>, {
    source: observable,
    children: (value) => {
      const text: string = value;
      // @ts-expect-error ObservableValue 保留值类型。
      const number: number = value;
      return text + number;
    },
  });
  const wrongFlux: FluxValueProps<number, { type: "add" }> = {
    // @ts-expect-error 普通 source 缺少 FluxStore 写入与生命周期接口。
    source: plain,
    children: (value) => String(value),
  };
  const wrongObservable: ObservableValueProps<number> = {
    // @ts-expect-error 普通 source 缺少 ObservableState 的状态和 dispose。
    source: plain,
    children: (value) => String(value),
  };
  return { wrongFlux, wrongObservable };
}
