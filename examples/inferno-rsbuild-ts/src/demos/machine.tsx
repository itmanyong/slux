import { createMachine } from "@slux/state-machine";
import { MachineValue } from "@slux/inferno/state-machine";
import { Component } from "inferno";
import type { InfernoNode } from "inferno";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface DemoProps {
  log: Log;
}

interface FetchContext {
  retries: number;
}

type FetchEvent = { type: "START" } | { type: "RESOLVE" } | { type: "FAIL" } | { type: "RETRY" } | { type: "RESET" };

type FetchState = "idle" | "loading" | "success" | "error";

/** MachineValue：有限状态机接管异步流程，guard 限制无限重试。 */
export class MachineDemo extends Component<DemoProps> {
  #machine = createMachine<FetchContext, FetchEvent, FetchState>({
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

  override render(): InfernoNode {
    return (
      <div class="fd">
        <div class="fd-row">
          <span class="fd-label">state</span>
          <MachineValue<FetchContext, FetchEvent, FetchState> source={this.#machine}>
            {(snapshot) => (
              <>
                <span class="fd-value is-strong">{snapshot.value}</span>
                <span class="fd-badge">retries {snapshot.context.retries}</span>
              </>
            )}
          </MachineValue>
        </div>
        <div class="fd-actions">
          <button
            type="button"
            class="fd-btn is-primary"
            onClick={() => {
              this.#machine.send({ type: "START" });
              this.props.log("send START", "write");
            }}
          >
            START
          </button>
          <button
            type="button"
            class="fd-btn"
            onClick={() => {
              this.#machine.send({ type: "RESOLVE" });
              this.props.log("send RESOLVE", "write");
            }}
          >
            RESOLVE
          </button>
          <button
            type="button"
            class="fd-btn"
            onClick={() => {
              this.#machine.send({ type: "FAIL" });
              this.props.log("send FAIL", "write");
            }}
          >
            FAIL
          </button>
          <button
            type="button"
            class="fd-btn"
            onClick={() => {
              this.#machine.send({ type: "RETRY" });
              this.props.log("send RETRY（guard 限 2 次）", "write");
            }}
          >
            RETRY
          </button>
          <button
            type="button"
            class="fd-btn"
            onClick={() => {
              this.#machine.send({ type: "RESET" });
              this.props.log("send RESET", "write");
            }}
          >
            RESET
          </button>
        </div>
        <p class="fd-note">error 态的 RETRY 带 guard：超过 2 次重试后事件被拒绝，状态停在 error。</p>
      </div>
    );
  }
}
