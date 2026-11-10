import type { ExampleDemo } from "@slux/shell-example";
import { atom, writableAtom } from "@slux/atom";

export const create: NonNullable<ExampleDemo["create"]> = (context) => {
  const celsius = atom(0);
  const fahrenheit = writableAtom(
    (get) => (get(celsius) * 9) / 5 + 32,
    (_get, set, next: number) => {
      set(celsius, ((next - 32) * 5) / 9);
    },
  );
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };
  const stops = [
    celsius.subscribe((value) => {
      context.log(`celsius → ${value}`, "notify");
      notify();
    }),
    fahrenheit.subscribe((value) => {
      context.log(`fahrenheit → ${value}`, "compute");
      notify();
    }),
  ];

  return {
    readouts: [
      {
        kind: "metric",
        label: "celsius °C",
        emphasis: true,
        read: () => String(celsius.get()),
      },
      {
        kind: "metric",
        label: "fahrenheit °F",
        read: () => String(fahrenheit.get()),
      },
    ],
    actions: [
      {
        id: "write-f",
        label: "write °F",
        input: { kind: "number", placeholder: "华氏温度", value: "212" },
        run: (input) => {
          const next = Number(input);
          if (Number.isNaN(next)) {
            context.log(`"${input}" 不是数字，write 被跳过`, "error");
            return;
          }
          fahrenheit.write(next);
          context.log(`fahrenheit.write(${next}) → set(celsius, ${celsius.get()})，write 自动包进 batch`, "write");
        },
      },
      {
        id: "inc-c",
        label: "celsius + 10",
        run: () => {
          celsius.update((value) => value + 10);
          context.log("celsius.update((value) => value + 10)", "write");
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
