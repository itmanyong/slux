import { computed, signal } from "@slux/core";
import { useSignal } from "@slux/preact";
import { useState } from "preact/hooks";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** useSignal(computed)：派生值只在依赖变化时惰性重算。 */
export function UseComputedDemo({ log }: { log: Log }) {
  const [{ left, right, total }] = useState(() => {
    const left = signal(2);
    const right = signal(3);
    const total = computed(() => left.get() * right.get());
    return { left, right, total };
  });
  const a = useSignal(left);
  const b = useSignal(right);
  const sum = useSignal(total);

  return (
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">left × right</span>
        <span class="fd-value">
          {a} × {b}
        </span>
        <span class="fd-value is-strong">= {sum}</span>
      </div>
      <div class="fd-actions">
        <button
          type="button"
          class="fd-btn"
          onClick={() => {
            left.set(left.get() + 1);
            log(`left → ${left.get()}`, "write");
          }}
        >
          left + 1
        </button>
        <button
          type="button"
          class="fd-btn is-primary"
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
