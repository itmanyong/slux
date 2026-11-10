import { createFluxStore } from "@slux/flux";
import { useFluxStore } from "@slux/ripple/flux";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface CounterState {
  count: number;
}

type CounterAction = { type: "increment"; by: number } | { type: "reset" };

/** useFluxStore：Redux 式 reducer + dispatch，状态经 action 单向流动。 */
export function UseFluxDemo(props: { log: Log }) @{
  const store = createFluxStore<CounterState, CounterAction>(
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
  const state = useFluxStore(store);

  <div class="fd">
    <div class="fd-row">
      <span class="fd-label">count</span>
      <span class="fd-value is-strong">{state.value.count}</span>
    </div>
    <div class="fd-actions">
      <button
        type="button"
        class="fd-btn is-primary"
        onClick={() => {
          store.dispatch({ type: "increment", by: 1 });
          props.log("dispatch increment by 1", "write");
        }}
      >
        + 1
      </button>
      <button
        type="button"
        class="fd-btn"
        onClick={() => {
          store.dispatch({ type: "increment", by: 5 });
          props.log("dispatch increment by 5", "write");
        }}
      >
        + 5
      </button>
      <button
        type="button"
        class="fd-btn"
        onClick={() => {
          store.dispatch({ type: "reset" });
          props.log("dispatch reset", "write");
        }}
      >
        重置
      </button>
    </div>
  </div>
}
