import { createFluxStore } from "@slux/flux";
import { injectFluxStore } from "@slux/angular/flux";
import { Component, inject } from "@angular/core";
import { DEMO_LOG } from "../boot";

interface CounterState {
  count: number;
}

type CounterAction = { type: "increment"; by: number } | { type: "reset" };

/** injectFluxStore：dispatch 单向流动，Signal 读取 reducer 后的状态。 */
@Component({
  selector: "demo-flux",
  template: `
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">count</span>
        <span class="fd-value is-strong">{{ state().count }}</span>
      </div>
      <div class="fd-actions">
        <button type="button" class="fd-btn is-primary" (click)="by(1)">+ 1</button>
        <button type="button" class="fd-btn" (click)="by(5)">+ 5</button>
        <button type="button" class="fd-btn" (click)="reset()">重置</button>
      </div>
    </div>
  `,
})
export class FluxDemo {
  private readonly log = inject(DEMO_LOG);
  private readonly store = createFluxStore<CounterState, CounterAction>(
    (state, action) => {
      switch (action.type) {
        case "increment":
          return { count: state.count + action.by };
        case "reset":
          return { count: 0 };
      }
    },
    { count: 0 },
  );
  readonly state = injectFluxStore(this.store);

  by(step: number): void {
    this.store.dispatch({ type: "increment", by: step });
    this.log(`dispatch increment by ${step}`, "write");
  }

  reset(): void {
    this.store.dispatch({ type: "reset" });
    this.log("dispatch reset", "write");
  }
}
