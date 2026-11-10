import { createFluxStore } from "@slux/flux";
import { useFluxStore } from "@slux/viewfly/flux";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface CounterState {
  count: number;
}

type CounterAction = { type: "increment"; by: number } | { type: "reset" };

/** useFluxStore：Redux 式 reducer + dispatch，状态经 action 单向流动。 */
export function UseFluxDemo({ log }: { log: Log }) {
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

  return () => (
    <div className="fd">
      <div className="fd-row">
        <span className="fd-label">count</span>
        <span className="fd-value is-strong">{state().count}</span>
      </div>
      <div className="fd-actions">
        <button
          type="button"
          className="fd-btn is-primary"
          onClick={() => {
            store.dispatch({ type: "increment", by: 1 });
            log("dispatch increment by 1", "write");
          }}
        >
          + 1
        </button>
        <button
          type="button"
          className="fd-btn"
          onClick={() => {
            store.dispatch({ type: "increment", by: 5 });
            log("dispatch increment by 5", "write");
          }}
        >
          + 5
        </button>
        <button
          type="button"
          className="fd-btn"
          onClick={() => {
            store.dispatch({ type: "reset" });
            log("dispatch reset", "write");
          }}
        >
          重置
        </button>
      </div>
    </div>
  );
}
