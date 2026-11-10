import { signal } from "@slux/core";
import { SignalValue } from "@slux/inferno";
import { Component } from "inferno";
import type { InfernoNode } from "inferno";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface DemoProps {
  log: Log;
}

/** SignalValue：挂载时订阅源，值变化即重渲染 render prop。 */
export class SignalDemo extends Component<DemoProps> {
  #count = signal(0);

  override render(): InfernoNode {
    return (
      <div class="fd">
        <div class="fd-row">
          <span class="fd-label">count</span>
          <SignalValue<number> source={this.#count}>{(value) => <span class="fd-value is-strong">{String(value)}</span>}</SignalValue>
        </div>
        <div class="fd-actions">
          <button
            type="button"
            class="fd-btn"
            onClick={() => {
              this.#count.set(this.#count.get() - 1);
              this.props.log(`set → ${this.#count.get()}`, "write");
            }}
          >
            − 1
          </button>
          <button
            type="button"
            class="fd-btn is-primary"
            onClick={() => {
              this.#count.set(this.#count.get() + 1);
              this.props.log(`set → ${this.#count.get()}`, "write");
            }}
          >
            + 1
          </button>
          <button
            type="button"
            class="fd-btn"
            onClick={() => {
              this.#count.set(0);
              this.props.log("归零", "write");
            }}
          >
            归零
          </button>
        </div>
      </div>
    );
  }
}
