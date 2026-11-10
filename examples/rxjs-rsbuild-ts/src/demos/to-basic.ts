import { signal } from "@slux/core";
import { toObservable } from "@slux/rxjs";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** toObservable：signal 变化即成为 Observable 的 next 发射。 */
export function createToBasic({ log }: { log: Log }) {
  const source = signal("hello");
  const stream$ = toObservable(source);
  const emissions: string[] = [];

  const subscription = stream$.subscribe((value) => {
    emissions.push(value);
    if (emissions.length > 8) emissions.shift();
    log(`Observable 发射 → ${value}`, "notify");
  });

  return {
    readouts: [
      {
        kind: "metric" as const,
        label: "source",
        emphasis: true,
        read: () => source.get(),
      },
      { kind: "list" as const, label: "emissions", read: () => emissions },
    ],
    actions: [
      {
        id: "set",
        label: "SET",
        primary: true,
        input: {
          kind: "text" as const,
          placeholder: "写入新的 source 值",
          value: "",
        },
        run: (input: string) => {
          if (!input.trim()) {
            log("SET 需要输入一个值", "error");
            return;
          }
          source.set(input.trim());
          log(`source.set(${JSON.stringify(input.trim())})`, "write");
        },
      },
    ],
    dispose: () => subscription.unsubscribe(),
  };
}
