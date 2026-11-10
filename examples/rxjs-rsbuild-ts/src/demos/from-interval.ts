import { fromObservable } from "@slux/rxjs";
import { interval, map } from "rxjs";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** fromObservable：interval 持续推进信号值，读数被动刷新。 */
export function createFromInterval({ log }: { log: Log }) {
  const state = fromObservable(interval(1000).pipe(map((tick) => `t+${tick}`)), "—");

  log("interval(1000) → fromObservable：读数随每秒发射自动刷新", "info");
  const stop = state.status.subscribe((status) => {
    if (status === "disposed") log("status → disposed", "scope");
  });

  return {
    readouts: [
      {
        kind: "metric" as const,
        label: "tick",
        emphasis: true,
        read: () => String(state.get()),
      },
      {
        kind: "text" as const,
        label: "status",
        read: () => state.status.get(),
      },
    ],
    actions: [
      {
        id: "stop",
        label: "STOP",
        primary: true,
        run: () => {
          state.dispose();
          log("dispose() → 退订 interval", "scope");
        },
      },
    ],
    subscribe: (listener: () => void) => {
      const unsubscribeValue = state.subscribe(listener);
      const unsubscribeStatus = state.status.subscribe(listener);
      return () => {
        unsubscribeValue();
        unsubscribeStatus();
      };
    },
    dispose: () => {
      stop();
      state.dispose();
    },
  };
}
