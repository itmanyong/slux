import { useSignal } from "@slux/octane";
import type { ReadonlySignal, Signal } from "@slux/core";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface ComputedProps {
  left: Signal<number>;
  right: Signal<number>;
  total: ReadonlySignal<number>;
  log: Log;
}

/** useSignal(computed)：派生值只在依赖变化时惰性重算。 */
export function UseComputedDemo({ left, right, total, log }: ComputedProps) {
  const a = useSignal(left);
  const b = useSignal(right);
  const sum = useSignal(total);

  return (
    <div className="fd">
      <div className="fd-row">
        <span className="fd-label">left × right</span>
        <span className="fd-value">
          {a} × {b}
        </span>
        <span className="fd-value is-strong">= {sum}</span>
      </div>
      <div className="fd-actions">
        <button
          type="button"
          className="fd-btn"
          onClick={() => {
            left.set(left.get() + 1);
            log(`left → ${left.get()}`, "write");
          }}
        >
          left + 1
        </button>
        <button
          type="button"
          className="fd-btn is-primary"
          onClick={() => {
            right.set(right.get() + 1);
            log(`right → ${right.get()}`, "write");
          }}
        >
          right + 1
        </button>
      </div>
    </div>
  );
}
