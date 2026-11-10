import { fromObservable } from "@slux/rxjs";
import { Subject } from "rxjs";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** fromObservable(Subject)：next / error / complete 三种通道全都有归宿。 */
export function createFromSubject({ log }: { log: Log }) {
  const subject = new Subject<string>();
  const state = fromObservable(subject, "—");

  const stopStatus = state.status.subscribe((status) => {
    log(`status → ${status}`, status === "error" ? "error" : "info");
  });

  return {
    readouts: [
      {
        kind: "metric" as const,
        label: "value",
        emphasis: true,
        read: () => String(state.get()),
      },
      {
        kind: "text" as const,
        label: "status",
        read: () => state.status.get(),
      },
      {
        kind: "text" as const,
        label: "error",
        read: () => {
          const reason = state.error.get();
          if (reason === undefined) return "—";
          return reason instanceof Error ? reason.message : String(reason);
        },
      },
    ],
    actions: [
      {
        id: "push",
        label: "PUSH",
        primary: true,
        input: {
          kind: "text" as const,
          placeholder: "subject.next(…)",
          value: "",
        },
        run: (input: string) => {
          if (!input.trim()) {
            log("PUSH 需要输入一个值", "error");
            return;
          }
          subject.next(input.trim());
          log(`subject.next(${JSON.stringify(input.trim())})`, "write");
        },
      },
      {
        id: "error",
        label: "ERROR",
        title: "让流失败，status → error",
        run: () => {
          subject.error(new Error("流被手动终结"));
          log("subject.error(...) → status error", "error");
        },
      },
      {
        id: "complete",
        label: "COMPLETE",
        title: "正常完结，status → complete",
        run: () => {
          subject.complete();
          log("subject.complete() → status complete", "info");
        },
      },
    ],
    dispose: () => {
      stopStatus();
      state.dispose();
    },
  };
}
