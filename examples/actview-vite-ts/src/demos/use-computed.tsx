import { computed, signal } from "@slux/core";
import { useSignal } from "@slux/actview";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** useSignal(computed)：派生值只在依赖变化时惰性重算。 */
export function UseComputedDemo({ log }: { log: Log }) {
  const left = signal(2);
  const right = signal(3);
  const total = computed(() => left.get() * right.get());
  const a = useSignal(left);
  const b = useSignal(right);
  const sum = useSignal(total);

  return (
    <div className="fd">
      <div className="fd-row">
        <span className="fd-label">left × right</span>
        <span className="fd-value">
          {String(a.value)} × {String(b.value)}
        </span>
        <span className="fd-value is-strong">= {String(sum.value)}</span>
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
