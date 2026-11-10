import { atom, derived } from "@slux/atom";
import { injectAtomValue, injectSetAtom } from "@slux/angular/atom";
import { Component, inject } from "@angular/core";
import { DEMO_LOG } from "../boot";

/** injectAtomValue + injectSetAtom：读写分离，派生 atom 自动跟随。 */
@Component({
  selector: "demo-atom",
  template: `
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">price</span>
        <span class="fd-value is-strong">{{ price() }}</span>
        <span class="fd-label">derived ×2</span>
        <span class="fd-badge">{{ double() }}</span>
      </div>
      <div class="fd-actions">
        <button type="button" class="fd-btn is-primary" (click)="addFive()">+ 5</button>
        <button type="button" class="fd-btn" (click)="reset()">重置</button>
      </div>
    </div>
  `,
})
export class AtomDemo {
  private readonly log = inject(DEMO_LOG);
  private readonly priceAtom = atom(10);
  private readonly doubleAtom = derived((get) => get(this.priceAtom) * 2);
  readonly price = injectAtomValue(this.priceAtom);
  readonly double = injectAtomValue(this.doubleAtom);
  private readonly setPrice = injectSetAtom(this.priceAtom);

  addFive(): void {
    this.setPrice(this.price() + 5);
    this.log(`price → ${this.price()}`, "write");
  }

  reset(): void {
    this.setPrice(10);
    this.log("price → 10", "write");
  }
}
