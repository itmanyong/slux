import { createStore } from "@slux/store";
import { StoreValue } from "@slux/inferno/store";
import { Component } from "inferno";
import type { InfernoNode } from "inferno";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface DemoProps {
  log: Log;
}

interface CartState {
  items: number;
  total: number;
}

/**
 * StoreValue + selector：只订阅 `items` 切片，
 * 只改 `total` 时这个组件不重渲染。
 */
export class StoreDemo extends Component<DemoProps> {
  #store = createStore<CartState>(() => ({ items: 0, total: 0 }));

  override render(): InfernoNode {
    return (
      <div class="fd">
        <div class="fd-row">
          <span class="fd-label">items（已订阅）</span>
          <StoreValue<CartState, number> store={this.#store} selector={(state) => state.items}>
            {(items) => <span class="fd-value is-strong">{String(items)}</span>}
          </StoreValue>
          <span class="fd-label">total（未订阅）</span>
          <StoreValue<CartState, number> store={this.#store} selector={(state) => state.total}>
            {(total) => <span class="fd-badge">{total.toFixed(1)}</span>}
          </StoreValue>
        </div>
        <div class="fd-actions">
          <button
            type="button"
            class="fd-btn is-primary"
            onClick={() => {
              this.#store.setState((state) => ({ items: state.items + 1 }));
              this.props.log("setState → items + 1", "write");
            }}
          >
            items + 1
          </button>
          <button
            type="button"
            class="fd-btn"
            onClick={() => {
              this.#store.setState((state) => ({ total: state.total + 9.9 }));
              this.props.log("setState → total + 9.9", "write");
            }}
          >
            只改 total
          </button>
          <button
            type="button"
            class="fd-btn"
            onClick={() => {
              this.#store.setState({ items: 0, total: 0 });
              this.props.log("setState → 清空", "write");
            }}
          >
            清空
          </button>
        </div>
      </div>
    );
  }
}
