import { atom, derived } from "@slux/atom";
import { AtomValue, setAtom } from "@slux/inferno/atom";
import { Component } from "inferno";
import type { InfernoNode } from "inferno";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface DemoProps {
  log: Log;
}

/** AtomValue + setAtom：读值走绑定，写值按 atom 替换契约走原实例。 */
export class AtomDemo extends Component<DemoProps> {
  #price = atom(10);
  #double = derived((get) => get(this.#price) * 2);

  override render(): InfernoNode {
    return (
      <div class="fd">
        <div class="fd-row">
          <span class="fd-label">price</span>
          <AtomValue<number> atom={this.#price}>{(value) => <span class="fd-value is-strong">{String(value)}</span>}</AtomValue>
          <span class="fd-label">derived ×2</span>
          <AtomValue<number> atom={this.#double}>{(value) => <span class="fd-badge">{String(value)}</span>}</AtomValue>
        </div>
        <div class="fd-actions">
          <button
            type="button"
            class="fd-btn is-primary"
            onClick={() => {
              setAtom(this.#price, this.#price.get() + 5);
              this.props.log(`price → ${this.#price.get()}`, "write");
            }}
          >
            + 5
          </button>
          <button
            type="button"
            class="fd-btn"
            onClick={() => {
              setAtom(this.#price, 10);
              this.props.log("price → 10", "write");
            }}
          >
            重置
          </button>
        </div>
      </div>
    );
  }
}
