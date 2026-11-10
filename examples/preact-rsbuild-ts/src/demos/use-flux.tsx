import { createFluxStore } from "@slux/flux";
import { useFluxStore } from "@slux/preact/flux";
import { useState } from "preact/hooks";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface CounterState {
  count: number;
}

type CounterAction = { type: "increment"; by: number } | { type: "reset" };

/** useFluxStore：reducer + dispatch 的单向数据流。 */
export function UseFluxDemo({ log }: { log: Log }) {
  const [store] = useState(() =>
    createFluxStore<CounterState, CounterAction>(
      (state, action) => {
        switch (action.type) {
          case "increment":
            return { count: state.count + action.by };
          case "reset":
            return { count: 0 };
        }
      },
      { count: 0 },
    ),
  );
  const state = useFluxStore(store);

  return (
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">count</span>
        <span class="fd-value is-strong">{state.count}</span>
      </div>
      <div class="fd-actions">
        <button
          type="button"
          class="fd-btn is-primary"
          onClick={() => {
            store.dispatch({ type: "increment", by: 1 });
            log("dispatch increment by 1", "write");
          }}
        >
          + 1
        </button>
        <button
          type="button"
          class="fd-btn"
          onClick={() => {
            store.dispatch({ type: "increment", by: 5 });
            log("dispatch increment by 5", "write");
          }}
        >
          + 5
        </button>
        <button
          type="button"
          class="fd-btn"
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
