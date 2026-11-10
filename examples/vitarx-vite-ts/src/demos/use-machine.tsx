import { computed as nativeComputed } from "vitarx";
import { createMachine } from "@slux/state-machine";
import { useMachine } from "@slux/vitarx/state-machine";
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

  const actions = nativeComputed(() => {
    const current = snapshot.value;
    if (current.value === "idle") {
      return (
        <button
          type="button"
          class="fd-btn is-primary"
          onClick={() => {
            machine.send({ type: "START" });
            log("send START", "write");
          }}
        >
          START
        </button>
      );
    }
    if (current.value === "loading") {
      return [
        <button
          type="button"
          class="fd-btn is-primary"
          onClick={() => {
            machine.send({ type: "RESOLVE" });
            log("send RESOLVE", "write");
          }}
        >
          RESOLVE
        </button>,
        <button
          type="button"
          class="fd-btn"
          onClick={() => {
            machine.send({ type: "FAIL" });
            log("send FAIL", "write");
          }}
        >
          FAIL
        </button>,
      ];
    }
    if (current.value === "error") {
      return [
        <button
          type="button"
          class="fd-btn is-primary"
          onClick={() => {
            machine.send({ type: "RETRY" });
            const retries = snapshot.value.context.retries;
            log(retries < 2 ? `send RETRY → 第 ${retries + 1} 次重试` : "send RETRY → guard 拒绝（超过 2 次）", retries < 2 ? "write" : "error");
          }}
        >
          RETRY（guard 限 2 次）
        </button>,
        <button
          type="button"
          class="fd-btn"
          onClick={() => {
            machine.send({ type: "RESET" });
            log("send RESET", "write");
          }}
        >
          RESET
        </button>,
      ];
    }
    return (
      <button
        type="button"
        class="fd-btn is-primary"
        onClick={() => {
          machine.send({ type: "RESET" });
          log("send RESET", "write");
        }}
      >
        RESET
      </button>
    );
  });

  return (
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">state</span>
        <span class="fd-value is-strong">{nativeComputed(() => snapshot.value.value)}</span>
        <span class="fd-badge">{nativeComputed(() => `retries ${snapshot.value.context.retries}`)}</span>
      </div>
      <div class="fd-actions">{actions}</div>
      <p class="fd-note">error 态的 RETRY 带 guard：超过 2 次重试后事件被拒绝，状态停在 error。</p>
    </div>
  );
}
