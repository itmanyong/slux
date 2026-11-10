import { signal } from "@slux/core";
import { fromObservable, toObservable } from "@slux/rxjs";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** 双向桥接：signal → toObservable → fromObservable → 又回到信号。 */
export function createRoundTrip({ log }: { log: Log }) {
  const source = signal("a");
  const mirrored = fromObservable(toObservable(source), "—");

  log("signal → toObservable → fromObservable → signal", "info");

  return {
    readouts: [
      {
        kind: "metric" as const,
        label: "source",
        emphasis: true,
        read: () => source.get(),
      },
      {
        kind: "metric" as const,
        label: "mirrored",
        read: () => String(mirrored.get()),
      },
      {
        kind: "text" as const,
        label: "status",
        read: () => mirrored.status.get(),
      },
    ],
    actions: [
      {
        id: "set",
        label: "SET",
        primary: true,
        input: {
          kind: "text" as const,
          placeholder: "写入 source，观察镜像",
          value: "",
        },
        run: (input: string) => {
          if (!input.trim()) {
            log("SET 需要输入一个值", "error");
            return;
          }
          source.set(input.trim());
          log(`source.set(${JSON.stringify(input.trim())}) → mirrored ${JSON.stringify(String(mirrored.get()))}`, "write");
        },
      },
    ],
    subscribe: (listener: () => void) => mirrored.subscribe(listener),
    dispose: () => mirrored.dispose(),
  };
}
