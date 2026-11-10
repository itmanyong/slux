import type { Subscribable } from "@slux/core";
import { createFluxStore } from "@slux/flux";
import { createMachine } from "@slux/state-machine";
import { fromObservable } from "@slux/rxjs";
import { Subject } from "rxjs";

export function createSources() {
  const flux = createFluxStore<number, { type: "ADD"; amount: number }>((state, action) => state + action.amount, 1);
  const machine = createMachine<number, { type: "ADD"; amount: number }, "active">({
    initial: "active",
    context: 2,
    states: {
      active: {
        on: { ADD: { actions: (context, event) => context + event.amount } },
      },
    },
  });
  const subject = new Subject<number>();
  const observable = fromObservable(subject, 3);
  const subscriptions = { active: 0 };
  function track<T>(source: Subscribable<T>) {
    const subscribe = source.subscribe;
    source.subscribe = (callback) => {
      subscriptions.active++;
      const stop = subscribe(callback);
      return () => {
        subscriptions.active--;
        stop();
      };
    };
  }
  track(flux);
  track(machine);
  track(observable);
  return {
    flux,
    machine,
    observable,
    subject,
    subscriptions,
    update() {
      flux.dispatch({ type: "ADD", amount: 10 });
      machine.send({ type: "ADD", amount: 10 });
      subject.next(13);
    },
    dispose() {
      flux.destroy();
      machine.destroy();
      observable.dispose();
    },
  };
}
