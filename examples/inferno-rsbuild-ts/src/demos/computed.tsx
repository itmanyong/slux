import { computed, signal } from "@slux/core";
import { SignalValue } from "@slux/inferno";
import { Component } from "inferno";
import type { InfernoNode } from "inferno";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface DemoProps {
  log: Log;
}

/** SignalValue(computed)：派生值只在依赖变化时惰性重算。 */
export class ComputedDemo extends Component<DemoProps> {
  #a = signal(2);
  #b = signal(3);
  #total = computed(() => this.#a.get() * this.#b.get());

  override render(): InfernoNode {
    return (
      <div class="fd">
        <div class="fd-row">
          <span class="fd-label">left × right</span>
          <SignalValue<number> source={this.#a}>{(a) => <span class="fd-value">{String(a)}</span>}</SignalValue>
          <span class="fd-value">×</span>
          <SignalValue<number> source={this.#b}>{(b) => <span class="fd-value">{String(b)}</span>}</SignalValue>
          <SignalValue<number> source={this.#total}>{(sum) => <span class="fd-value is-strong">= {String(sum)}</span>}</SignalValue>
        </div>
        <div class="fd-actions">
          <button
            type="button"
            class="fd-btn"
            onClick={() => {
              this.#a.set(this.#a.get() + 1);
              this.props.log(`left → ${this.#a.get()}`, "write");
            }}
          >
            left + 1
          </button>
          <button
            type="button"
            class="fd-btn is-primary"
            onClick={() => {
              this.#b.set(this.#b.get() + 1);
              this.props.log(`right → ${this.#b.get()}`, "write");
            }}
          >
            right + 1
          </button>
        </div>
      </div>
    );
  }
}
