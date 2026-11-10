import { computed, signal } from "@slux/core";
import { toAngularSignal } from "@slux/angular";
import { Component, inject } from "@angular/core";
import { DEMO_LOG } from "../boot";

/** toAngularSignal(computed)：派生值只在依赖变化时惰性重算。 */
@Component({
  selector: "demo-computed",
  template: `
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">left × right</span>
        <span class="fd-value">{{ left() }} × {{ right() }}</span>
        <span class="fd-value is-strong">= {{ total() }}</span>
      </div>
      <div class="fd-actions">
        <button type="button" class="fd-btn" (click)="incLeft()">left + 1</button>
        <button type="button" class="fd-btn is-primary" (click)="incRight()">right + 1</button>
      </div>
    </div>
  `,
})
export class ComputedDemo {
  private readonly log = inject(DEMO_LOG);
  private readonly a = signal(2);
  private readonly b = signal(3);
  private readonly product = computed(() => this.a.get() * this.b.get());
  readonly left = toAngularSignal(this.a);
  readonly right = toAngularSignal(this.b);
  readonly total = toAngularSignal(this.product);

  incLeft(): void {
    this.a.set(this.a.get() + 1);
    this.log(`left → ${this.a.get()}`, "write");
  }

  incRight(): void {
    this.b.set(this.b.get() + 1);
    this.log(`right → ${this.b.get()}`, "write");
  }
}
