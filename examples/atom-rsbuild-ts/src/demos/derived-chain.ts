import type { ExampleDemo } from "@slux/shell-example";
import { atom, derived } from "@slux/atom";

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const a = atom(2);
  const b = atom(3);
  const total = derived((get) => get(a) + get(b));
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };
  const stops = [
    a.subscribe((value) => {
      context.log(`a → ${value}`, "notify");
      notify();
    }),
    b.subscribe((value) => {
      context.log(`b → ${value}`, "notify");
      notify();
    }),
    total.subscribe((value) => {
      context.log(`total = a + b → ${value}`, "compute");
      notify();
    }),
  ];

  return {
    readouts: [
      { kind: "metric", label: "a", read: () => String(a.get()) },
      { kind: "metric", label: "b", read: () => String(b.get()) },
      {
        kind: "metric",
        label: "total = a + b",
        emphasis: true,
        read: () => String(total.get()),
      },
    ],
    actions: [
      {
        id: "inc-a",
        label: "a + 1",
        run: () => {
          a.update((value) => value + 1);
          context.log("a.update((value) => value + 1)", "write");
        },
      },
      {
        id: "inc-b",
        label: "b + 1",
        run: () => {
          b.update((value) => value + 1);
          context.log("b.update((value) => value + 1)", "write");
        },
      },
      {
        id: "reset",
        label: "重置 a / b",
        run: () => {
          a.set(2);
          b.set(3);
          context.log("a.set(2); b.set(3)", "write");
        },
      },
    ],
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      for (const stop of stops) stop();
    },
  };
};
