import { createStore } from "@slux/store";
import { injectStore } from "@slux/angular/store";
import { Component, inject } from "@angular/core";
import { DEMO_LOG } from "../boot";

interface CartState {
  items: number;
  total: number;
}

/** injectStore + selector：只订阅 `items` 切片，只改 `total` 时 Signal 不变。 */
@Component({
  selector: "demo-store",
  template: `
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">items（已订阅）</span>
        <span class="fd-value is-strong">{{ items() }}</span>
        <span class="fd-label">total（未订阅）</span>
        <span class="fd-badge">{{ total().toFixed(1) }}</span>
      </div>
      <div class="fd-actions">
        <button type="button" class="fd-btn is-primary" (click)="addItem()">items + 1</button>
        <button type="button" class="fd-btn" (click)="addTotal()">只改 total</button>
        <button type="button" class="fd-btn" (click)="clear()">清空</button>
      </div>
      <p class="fd-note">badge 里的 total 是读取时的快照，点「运行日志」查看重渲染证据。</p>
    </div>
  `,
})
export class StoreDemo {
  private readonly log = inject(DEMO_LOG);
  private readonly store = createStore<CartState>(() => ({
    items: 0,
    total: 0,
  }));
  readonly items = injectStore(this.store, (state) => state.items);
  readonly total = injectStore(this.store, (state) => state.total);

  addItem(): void {
    this.store.setState((state) => ({ items: state.items + 1 }));
    this.log("setState → items + 1", "write");
  }

  addTotal(): void {
    this.store.setState((state) => ({ total: state.total + 9.9 }));
    this.log("setState → total + 9.9（items Signal 不变）", "write");
  }

  clear(): void {
    this.store.setState({ items: 0, total: 0 });
    this.log("setState → 清空", "write");
  }
}
