import { computed, signal } from "@slux/core";
import { toAngularSignal } from "@slux/angular";
import { Component, inject } from "@angular/core";
import { DEMO_LOG } from "../boot";

/** toAngularSignal：slux 信号在注入上下文中变成只读 Angular Signal。 */
@Component({
  selector: "demo-signal",
  template: `
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">count × 2</span>
        <span class="fd-value is-strong">{{ value() }}</span>
      </div>
      <div class="fd-actions">
        <button type="button" class="fd-btn" (click)="dec()">− 1</button>
        <button type="button" class="fd-btn is-primary" (click)="inc()">+ 1</button>
        <button type="button" class="fd-btn" (click)="reset()">归零</button>
      </div>
    </div>
  `,
})
export class SignalDemo {
  private readonly log = inject(DEMO_LOG);
  private readonly count = signal(0);
  private readonly doubled = computed(() => this.count.get() * 2);
  readonly value = toAngularSignal(this.doubled);

  inc(): void {
    this.count.set(this.count.get() + 1);
    this.log(`count → ${this.count.get()}，Signal → ${this.value()}`, "write");
  }

  dec(): void {
    this.count.set(this.count.get() - 1);
    this.log(`count → ${this.count.get()}，Signal → ${this.value()}`, "write");
  }

  reset(): void {
    this.count.set(0);
    this.log("归零", "write");
  }
}
