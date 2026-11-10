import { createFluxStore } from "@slux/flux";
import { createMachine } from "@slux/state-machine";
import { fromObservable } from "@slux/rxjs";
import type { Subscribable } from "@slux/core";
import { Subject } from "rxjs";

export function sources() {
  const flux = createFluxStore((state: number, action: { type: "increment" }) => {
    return action.type === "increment" ? state + 1 : state;
  }, 1);
  const machine = createMachine<{ count: number }, { type: "GO" }, "idle" | "done">({
    initial: "idle",
    context: { count: 0 },
    states: {
      idle: {
        on: {
          GO: {
            target: "done",
            actions: (context) => ({ count: context.count + 1 }),
          },
        },
      },
      done: {},
    },
  });
  const events = new Subject<number>();
  const observable = fromObservable(events, 3);
  let active = 0;
  function track<T, Source extends Subscribable<T>>(source: Source): Source {
    return {
      ...source,
      subscribe(callback: (value: T) => void) {
        active++;
        const stop = source.subscribe(callback);
        return () => {
          active--;
          stop();
        };
      },
    };
  }
  return {
    flux: track<number, typeof flux>(flux),
    machine: track<ReturnType<typeof machine.get>, typeof machine>(machine),
    observable: track<number, typeof observable>(observable),
    events,
    active: () => active,
    update() {
      flux.dispatch({ type: "increment" });
      machine.send({ type: "GO" });
      events.next(4);
    },
    dispose() {
      flux.destroy();
      machine.destroy();
      observable.dispose();
    },
  };
}
