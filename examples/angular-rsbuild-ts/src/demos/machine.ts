import { createMachine } from "@slux/state-machine";
import { injectMachine } from "@slux/angular/state-machine";
import { Component, inject } from "@angular/core";
import { DEMO_LOG } from "../boot";

interface FetchContext {
  retries: number;
}

type FetchEvent = { type: "START" } | { type: "RESOLVE" } | { type: "FAIL" } | { type: "RETRY" } | { type: "RESET" };

type FetchState = "idle" | "loading" | "success" | "error";

/** injectMachine：有限状态机接管异步流程，guard 限制无限重试。 */
@Component({
  selector: "demo-machine",
  template: `
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">state</span>
        <span class="fd-value is-strong">{{ snapshot().value }}</span>
        <span class="fd-badge">retries {{ snapshot().context.retries }}</span>
      </div>
      <div class="fd-actions">
        <button type="button" class="fd-btn is-primary" (click)="send('START')">START</button>
        <button type="button" class="fd-btn" (click)="send('RESOLVE')">RESOLVE</button>
        <button type="button" class="fd-btn" (click)="send('FAIL')">FAIL</button>
        <button type="button" class="fd-btn" (click)="retry()">RETRY（guard 限 2 次）</button>
        <button type="button" class="fd-btn" (click)="send('RESET')">RESET</button>
      </div>
      <p class="fd-note">error 态的 RETRY 带 guard：超过 2 次重试后事件被拒绝，状态停在 error。</p>
    </div>
  `,
})
export class MachineDemo {
  private readonly log = inject(DEMO_LOG);
  private readonly machine = createMachine<FetchContext, FetchEvent, FetchState>({
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
  readonly snapshot = injectMachine(this.machine);

  send(type: "START" | "RESOLVE" | "FAIL" | "RESET"): void {
    this.machine.send({ type });
    this.log(`send ${type}`, "write");
  }

  retry(): void {
    const retries = this.snapshot().context.retries;
    this.machine.send({ type: "RETRY" });
    this.log(retries < 2 ? `send RETRY → 第 ${retries + 1} 次重试` : "send RETRY → guard 拒绝（超过 2 次）", retries < 2 ? "write" : "error");
  }
}
