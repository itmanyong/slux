import { computed, signal } from "@slux/core";
import { useSignal } from "@slux/viewfly";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** useSignal 订阅派生值：computed 只在依赖变化时惰性重算。 */
export function UseComputedDemo({ log }: { log: Log }) {
  const a = signal(3);
  const b = signal(4);
  const sum = computed(() => a.get() + b.get());
  const total = useSignal(sum);

  return () => (
    <div className="fd">
      <div className="fd-row">
        <span className="fd-label">a + b</span>
        <span className="fd-value is-strong">{total()}</span>
        <span className="fd-label">a</span>
        <span className="fd-badge">{a.get()}</span>
        <span className="fd-label">b</span>
        <span className="fd-badge">{b.get()}</span>
      </div>
      <div className="fd-actions">
        <button
          type="button"
          className="fd-btn is-primary"
          onClick={() => {
            a.set(a.get() + 1);
            log(`a → ${a.get()}，sum 重算为 ${sum.get()}`, "compute");
          }}
        >
          a + 1
        </button>
        <button
          type="button"
          className="fd-btn"
          onClick={() => {
            b.set(b.get() + 1);
            log(`b → ${b.get()}，sum 重算为 ${sum.get()}`, "compute");
          }}
        >
          b + 1
        </button>
      </div>
    </div>
  );
}
