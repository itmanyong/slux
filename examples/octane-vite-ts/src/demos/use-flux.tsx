import { useFluxStore } from "@slux/octane/flux";
import type { FluxStore } from "@slux/flux";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface CounterState {
  count: number;
}

type CounterAction = { type: "increment"; by: number } | { type: "reset" };

/** useFluxStore：Redux 式 reducer + dispatch，状态经 action 单向流动。 */
export function UseFluxDemo({ store, log }: { store: FluxStore<CounterState, CounterAction>; log: Log }) {
  const state = useFluxStore(store);

  return (
    <div className="fd">
      <div className="fd-row">
        <span className="fd-label">count</span>
        <span className="fd-value is-strong">{state.count}</span>
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
