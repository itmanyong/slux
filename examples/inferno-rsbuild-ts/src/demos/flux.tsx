import { createFluxStore } from "@slux/flux";
import { FluxValue } from "@slux/inferno/flux";
import { Component } from "inferno";
import type { InfernoNode } from "inferno";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface DemoProps {
  log: Log;
}

interface CounterState {
  count: number;
}

type CounterAction = { type: "increment"; by: number } | { type: "reset" };

/** FluxValue：dispatch 单向流动，组件读取 reducer 后的状态。 */
export class FluxDemo extends Component<DemoProps> {
  #store = createFluxStore<CounterState, CounterAction>(
    (state, action) => {
      switch (action.type) {
        case "increment":
          return { count: state.count + action.by };
        case "reset":
          return { count: 0 };
      }
    },
    { count: 0 },
  );

  override render(): InfernoNode {
    return (
      <div class="fd">
        <div class="fd-row">
          <span class="fd-label">count</span>
          <FluxValue<CounterState, CounterAction> source={this.#store}>
            {(state) => <span class="fd-value is-strong">{String(state.count)}</span>}
          </FluxValue>
        </div>
        <div class="fd-actions">
          <button
            type="button"
            class="fd-btn is-primary"
            onClick={() => {
              this.#store.dispatch({ type: "increment", by: 1 });
              this.props.log("dispatch increment by 1", "write");
            }}
          >
            + 1
          </button>
          <button
            type="button"
            class="fd-btn"
            onClick={() => {
              this.#store.dispatch({ type: "increment", by: 5 });
              this.props.log("dispatch increment by 5", "write");
            }}
          >
            + 5
          </button>
          <button
            type="button"
            class="fd-btn"
            onClick={() => {
              this.#store.dispatch({ type: "reset" });
              this.props.log("dispatch reset", "write");
            }}
          >
            重置
          </button>
        </div>
      </div>
    );
  }
}
