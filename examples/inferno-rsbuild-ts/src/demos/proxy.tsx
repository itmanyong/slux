import { observable } from "@slux/proxy";
import { ProxyValue } from "@slux/inferno/proxy";
import { Component } from "inferno";
import type { InfernoNode } from "inferno";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface DemoProps {
  log: Log;
}

/** ProxyValue：深层代理直接改属性，组件拿到不可变快照。 */
export class ProxyDemo extends Component<DemoProps> {
  #user = observable({ name: "Ada", scores: [60, 72] });

  override render(): InfernoNode {
    return (
      <div class="fd">
        <div class="fd-row">
          <span class="fd-label">user</span>
          <ProxyValue<{ name: string; scores: number[] }> proxy={this.#user}>
            {(snap) => (
              <>
                <span class="fd-value is-strong">{snap.name}</span>
                <span class="fd-badge">{snap.scores.join(" / ")}</span>
              </>
            )}
          </ProxyValue>
        </div>
        <div class="fd-actions">
          <button
            type="button"
            class="fd-btn is-primary"
            onClick={() => {
              const scores = this.#user.scores;
              scores.push(Math.min(100, scores.at(-1)! + 8));
              this.props.log(`scores.push → ${scores.at(-1)}`, "write");
            }}
          >
            追加成绩
          </button>
          <button
            type="button"
            class="fd-btn"
            onClick={() => {
              this.#user.name = this.#user.name === "Ada" ? "Lin" : "Ada";
              this.props.log(`name → ${this.#user.name}`, "write");
            }}
          >
            改名
          </button>
        </div>
      </div>
    );
  }
}
