import { observable } from "@slux/proxy";
import { injectSnapshot } from "@slux/angular/proxy";
import { Component, inject } from "@angular/core";
import { DEMO_LOG } from "../boot";

/** injectSnapshot：深层代理对象直接改属性，Signal 返回不可变快照。 */
@Component({
  selector: "demo-proxy",
  template: `
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">user</span>
        <span class="fd-value is-strong">{{ snap().name }}</span>
        <span class="fd-badge">{{ scores() }}</span>
      </div>
      <div class="fd-actions">
        <button type="button" class="fd-btn is-primary" (click)="addScore()">追加成绩</button>
        <button type="button" class="fd-btn" (click)="rename()">改名</button>
      </div>
    </div>
  `,
})
export class ProxyDemo {
  private readonly log = inject(DEMO_LOG);
  private readonly user = observable({ name: "Ada", scores: [60, 72] });
  readonly snap = injectSnapshot(this.user);

  scores(): string {
    return this.snap().scores.join(" / ");
  }

  addScore(): void {
    const scores = this.user.scores;
    const last = scores.at(-1) ?? 0;
    scores.push(Math.min(100, last + 8));
    this.log(`scores.push → ${scores.at(-1)}`, "write");
  }

  rename(): void {
    this.user.name = this.user.name === "Ada" ? "Lin" : "Ada";
    this.log(`name → ${this.user.name}`, "write");
  }
}
