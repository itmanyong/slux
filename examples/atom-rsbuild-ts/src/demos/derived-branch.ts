import type { ExampleDemo } from "@slux/shell-example";
import { atom, derived } from "@slux/atom";

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const mode = atom<"double" | "triple">("double");
  const x = atom(1);
  const y = atom(1);
  const result = derived((get) => (get(mode) === "double" ? get(x) * 2 : get(y) * 3));
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };
  const stops = [
    mode.subscribe((value) => {
      context.log(`mode → ${value}（分支切换，旧依赖被释放）`, "write");
      notify();
    }),
    result.subscribe((value) => {
      context.log(`result → ${value}`, "compute");
      notify();
    }),
  ];

  return {
    readouts: [
      { kind: "text", label: "mode", read: () => mode.get() },
      { kind: "metric", label: "x", read: () => String(x.get()) },
      { kind: "metric", label: "y", read: () => String(y.get()) },
      {
        kind: "metric",
        label: "result",
        emphasis: true,
        read: () => String(result.get()),
      },
    ],
    actions: [
      {
        id: "switch",
        label: "切换 double / triple",
        run: () => {
          const next = mode.get() === "double" ? "triple" : "double";
          mode.set(next);
          context.log(`mode.set("${next}")`, "write");
        },
      },
      {
        id: "inc-x",
        label: "x + 1",
        run: () => {
          x.update((value) => value + 1);
          context.log("x.update((value) => value + 1)", "write");
        },
      },
      {
        id: "inc-y",
        label: "y + 1",
        run: () => {
          y.update((value) => value + 1);
          context.log("y.update((value) => value + 1)", "write");
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
