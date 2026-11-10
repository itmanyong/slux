import { fromObservable } from "@slux/rxjs";
import { injectObservable } from "@slux/angular/rxjs";
import { Component, inject } from "@angular/core";
import { Subject } from "rxjs";
import { DEMO_LOG } from "../boot";

/** injectObservable：RxJS 流经 fromObservable 桥接，next 即更新 Signal。 */
@Component({
  selector: "demo-rxjs",
  template: `
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">latest</span>
        <span class="fd-value is-strong">{{ value() }}</span>
      </div>
      <div class="fd-actions">
        <button type="button" class="fd-btn is-primary" (click)="push()">推送事件</button>
      </div>
      <p class="fd-note">fromObservable 把 RxJS 流桥接为 Subscribable，injectObservable 订阅并随组件销毁退订。</p>
    </div>
  `,
})
export class RxjsDemo {
  private readonly log = inject(DEMO_LOG);
  private readonly events = new Subject<number>();
  private readonly bridge = fromObservable(this.events, 0);
  private seq = 0;
  readonly value = injectObservable(this.bridge);

  push(): void {
    this.seq += 1;
    this.events.next(this.seq);
    this.log(`events.next(${this.seq})`, "write");
  }
}
