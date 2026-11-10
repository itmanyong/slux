import { useSignal } from "@slux/octane";
import type { Signal } from "@slux/core";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** useSignal：Octane 组件经 useSyncExternalStore 订阅任意 Subscribable。 */
export function UseSignalDemo({ count, log }: { count: Signal<number>; log: Log }) {
  const value = useSignal(count);

  return (
    <div className="fd">
      <div className="fd-row">
        <span className="fd-label">count</span>
        <span className="fd-value is-strong">{value}</span>
      </div>
      <div className="fd-actions">
        <button
          type="button"
          className="fd-btn"
          onClick={() => {
            count.set(count.get() - 1);
            log(`set → ${count.get()}`, "write");
          }}
        >
          − 1
        </button>
        <button
          type="button"
          className="fd-btn is-primary"
          onClick={() => {
            count.set(count.get() + 1);
            log(`set → ${count.get()}`, "write");
          }}
        >
          + 1
        </button>
        <button
          type="button"
          className="fd-btn"
          onClick={() => {
            count.set(0);
            log("归零", "write");
          }}
        >
          归零
        </button>
      </div>
    </div>
  );
}
