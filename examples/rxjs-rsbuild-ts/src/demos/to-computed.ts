import { computed, signal } from "@slux/core";
import { toObservable } from "@slux/rxjs";
import { filter, map } from "rxjs";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** toObservable(computed)：派生值接上 rxjs 管道，map / filter 照常工作。 */
export function createToComputed({ log }: { log: Log }) {
  const source = signal(1);
  const double = computed(() => source.get() * 2);
  const pipeline$ = toObservable(double).pipe(
    map((value) => value * 10),
    filter((value) => value > 0),
  );
  const emissions: string[] = [];

  const subscription = pipeline$.subscribe((value) => {
    emissions.push(`×10 → ${value}`);
    if (emissions.length > 6) emissions.shift();
    log(`管道发射 → ${value}`, "compute");
  });

  return {
    readouts: [
      {
        kind: "metric" as const,
        label: "source",
        emphasis: true,
        read: () => String(source.get()),
      },
      {
        kind: "metric" as const,
        label: "double",
        read: () => String(double.get()),
      },
      { kind: "list" as const, label: "emissions", read: () => emissions },
    ],
    actions: [
      {
        id: "inc",
        label: "+ 1",
        primary: true,
        run: () => {
          source.set(source.get() + 1);
          log(`source.set(${source.get()})`, "write");
        },
      },
      {
        id: "set",
        label: "SET",
        input: {
          kind: "number" as const,
          placeholder: "写入 source 数值",
          value: "",
        },
        run: (input: string) => {
          const value = Number(input);
          if (!Number.isFinite(value)) {
            log(`SET 需要一个数字，收到 ${JSON.stringify(input)}`, "error");
            return;
          }
          source.set(value);
          log(`source.set(${value})`, "write");
        },
      },
    ],
    dispose: () => subscription.unsubscribe(),
  };
}
