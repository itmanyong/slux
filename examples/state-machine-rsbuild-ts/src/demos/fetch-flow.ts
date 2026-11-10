import { createMachine } from "@slux/state-machine";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface FetchContext {
  retries: number;
}

type FetchEvent = { type: "START" } | { type: "RESOLVE" } | { type: "FAIL" } | { type: "RETRY" } | { type: "RESET" };

type FetchState = "idle" | "loading" | "success" | "error";

/** 请求机：异步流程建模，非法事件被悄悄吞掉。 */
export function createFetchFlow({ log }: { log: Log }) {
  const machine = createMachine<FetchContext, FetchEvent, FetchState>({
    initial: "idle",
    context: { retries: 0 },
    states: {
      idle: {
        on: {
          START: { target: "loading" },
        },
      },
      loading: {
        on: {
          RESOLVE: { target: "success" },
          FAIL: { target: "error" },
        },
      },
      success: {
        on: {
          RESET: {
            target: "idle",
            actions: [(context) => ({ ...context, retries: 0 })],
          },
        },
      },
      error: {
        on: {
          RETRY: {
            target: "loading",
            guard: (context) => context.retries < 2,
            actions: [(context) => ({ ...context, retries: context.retries + 1 })],
          },
          RESET: {
            target: "idle",
            actions: [(context) => ({ ...context, retries: 0 })],
          },
        },
      },
    },
  });
  const path: FetchState[] = ["idle", "loading", "success", "error"];

  log("请求机：idle → loading → success / error", "info");

  const send = (event: FetchEvent): void => {
    const before = machine.get();
    const after = machine.send(event);
    if (after === before) {
      log(`send ${event.type} → 被忽略（当前状态不接受）`, "error");
      return;
    }
    log(`send ${event.type} → ${before.value} → ${after.value}（retries ${after.context.retries}）`, "write");
  };

  return {
    readouts: [
      {
        kind: "metric" as const,
        label: "state",
        emphasis: true,
        read: () => machine.get().value,
      },
      {
        kind: "metric" as const,
        label: "retries",
        read: () => String(machine.get().context.retries),
      },
      {
        kind: "flow" as const,
        label: "path",
        read: () => {
          const current = machine.get().value;
          return path.map((state) => ({
            label: state,
            value: state === current ? "当前" : "·",
          }));
        },
      },
    ],
    actions: [
      {
        id: "start",
        label: "START",
        primary: true,
        run: () => send({ type: "START" }),
      },
      { id: "resolve", label: "RESOLVE", run: () => send({ type: "RESOLVE" }) },
      { id: "fail", label: "FAIL", run: () => send({ type: "FAIL" }) },
      {
        id: "retry",
        label: "RETRY",
        title: "error 态可用，guard 限 2 次",
        run: () => send({ type: "RETRY" }),
      },
      { id: "reset", label: "RESET", run: () => send({ type: "RESET" }) },
    ],
    dispose: () => machine.destroy(),
  };
}
