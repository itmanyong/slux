import { createMachine } from "@slux/state-machine";
import { useMachine } from "@slux/actview/state-machine";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface FetchContext {
  retries: number;
}

type FetchEvent = { type: "START" } | { type: "RESOLVE" } | { type: "FAIL" } | { type: "RETRY" } | { type: "RESET" };

type FetchState = "idle" | "loading" | "success" | "error";

/** useMachine：有限状态机接管异步流程，guard 限制无限重试。 */
export function UseMachineDemo({ log }: { log: Log }) {
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
  const snapshot = useMachine(machine);

  return (
    <div className="fd">
      <div className="fd-row">
        <span className="fd-label">state</span>
        <span className="fd-value is-strong">{String(snapshot.value.value)}</span>
        <span className="fd-badge">retries {String(snapshot.value.context.retries)}</span>
      </div>
      <div className="fd-actions">
        {snapshot.value.value === "idle" && (
          <button
            type="button"
            className="fd-btn is-primary"
            onClick={() => {
              machine.send({ type: "START" });
              log("send START", "write");
            }}
          >
            START
          </button>
        )}
        {snapshot.value.value === "loading" && (
          <>
            <button
              type="button"
              className="fd-btn is-primary"
              onClick={() => {
                machine.send({ type: "RESOLVE" });
                log("send RESOLVE", "write");
              }}
            >
              RESOLVE
            </button>
            <button
              type="button"
              className="fd-btn"
              onClick={() => {
                machine.send({ type: "FAIL" });
                log("send FAIL", "write");
              }}
            >
              FAIL
            </button>
          </>
        )}
        {snapshot.value.value === "error" && (
          <>
            <button
              type="button"
              className="fd-btn is-primary"
              onClick={() => {
                machine.send({ type: "RETRY" });
                log(
                  snapshot.value.context.retries < 2
                    ? `send RETRY → 第 ${snapshot.value.context.retries + 1} 次重试`
                    : "send RETRY → guard 拒绝（超过 2 次）",
                  snapshot.value.context.retries < 2 ? "write" : "error",
                );
              }}
            >
              RETRY（guard 限 2 次）
            </button>
            <button
              type="button"
              className="fd-btn"
              onClick={() => {
                machine.send({ type: "RESET" });
                log("send RESET", "write");
              }}
            >
              RESET
            </button>
          </>
        )}
        {snapshot.value.value === "success" && (
          <button
            type="button"
            className="fd-btn is-primary"
            onClick={() => {
              machine.send({ type: "RESET" });
              log("send RESET", "write");
            }}
          >
            RESET
          </button>
        )}
      </div>
      <p className="fd-note">error 态的 RETRY 带 guard：超过 2 次重试后事件被拒绝，状态停在 error。</p>
    </div>
  );
}
