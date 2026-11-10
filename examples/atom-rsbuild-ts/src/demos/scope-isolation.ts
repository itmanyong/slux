import type { ExampleDemo } from "@slux/shell-example";
import { atom, createAtomScope, derived } from "@slux/atom";

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const count = atom(0);
  const doubled = derived((get) => get(count) * 2);
  const request = createAtomScope();
  request.set(count, 100);

  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };
  const stops = [
    count.subscribe((value) => {
      context.log(`默认作用域 count → ${value}`, "notify");
      notify();
    }),
    request.sub(count, (value) => {
      context.log(`请求作用域 count → ${value}`, "scope");
      notify();
    }),
  ];

  return {
    readouts: [
      {
        kind: "metric",
        label: "默认作用域 count",
        read: () => String(count.get()),
      },
      {
        kind: "metric",
        label: "请求作用域 count",
        emphasis: true,
        read: () => String(request.get(count)),
      },
      {
        kind: "metric",
        label: "请求作用域 doubled",
        read: () => String(request.get(doubled)),
      },
    ],
    actions: [
      {
        id: "default-inc",
        label: "默认 + 1",
        run: () => {
          count.update((value) => value + 1);
          context.log("count.update(v + 1) — 只影响默认作用域", "write");
        },
      },
      {
        id: "request-inc",
        label: "请求 + 5",
        run: () => {
          request.set(count, request.get(count) + 5);
          context.log("request.set(count, …) — 只影响请求作用域", "scope");
        },
      },
      {
        id: "request-reset",
        label: "请求重置为 100",
        run: () => {
          request.set(count, 100);
          context.log("request.set(count, 100)", "scope");
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
