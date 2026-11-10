import type { Subscribable } from "@slux/core";
import { createFluxStore } from "@slux/flux";
import { createMachine } from "@slux/state-machine";
import { fromObservable } from "@slux/rxjs";
import { Subject } from "rxjs";

function trackSubscriptions<T>(source: Subscribable<T>) {
  const subscribe = source.subscribe;
  let active = 0;
  source.subscribe = (callback) => {
    active++;
    const stop = subscribe(callback);
    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      active--;
      stop();
    };
  };
  return () => active;
}

export function createSources(base = 0) {
  const flux = createFluxStore((state: number, action: { type: "add"; amount: number }) => state + action.amount, base + 1);
  const machine = createMachine<{ count: number }, { type: "advance"; amount: number }, "idle" | "ready">({
    initial: "idle",
    context: { count: base + 2 },
    states: {
      idle: {
        on: {
          advance: {
            target: "ready",
            actions: (context, event) => ({
              count: context.count + event.amount,
            }),
          },
        },
      },
      ready: {
        on: {
          advance: {
            actions: (context, event) => ({
              count: context.count + event.amount,
            }),
          },
        },
      },
    },
  });
  const subject = new Subject<number>();
  const observable = fromObservable(subject, base + 3);
  const counts = [trackSubscriptions(flux), trackSubscriptions(machine), trackSubscriptions(observable)];
  return {
    flux,
    machine,
    observable,
    subject,
    subscriptions: () => counts.map((count) => count()),
    update(amount: number) {
      flux.dispatch({ type: "add", amount });
      machine.send({ type: "advance", amount });
      subject.next(base + 3 + amount);
    },
    dispose() {
      flux.destroy();
      machine.destroy();
      observable.dispose();
    },
  };
}
export type Sources = ReturnType<typeof createSources>;
