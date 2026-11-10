import { signal } from "@slux/core";
import { useSignal } from "@slux/viewfly";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** useSignal：组件订阅任意 Subscribable，值变化即重渲染。 */
export function UseSignalDemo({ log }: { log: Log }) {
  const count = signal(0);
  const value = useSignal(count);

  return () => (
    <div className="fd">
      <div className="fd-row">
        <span className="fd-label">count</span>
        <span className="fd-value is-strong">{value()}</span>
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
