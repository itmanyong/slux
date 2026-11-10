import { computed, signal } from "@slux/core";
import type { Signal } from "@slux/core";
import { useSignal } from "@slux/solid";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

export function UseComputedDemo({ log }: { log: Log }) {
  const left = signal(2);
  const right = signal(3);
  const total = computed(() => left.get() * right.get());

  const a = useSignal(left);
  const b = useSignal(right);
  const sum = useSignal(total);

  const bump = (source: Signal<number>, name: string) => {
    source.set(source.get() + 1);
    log(`${name} → ${source.get()}`, "write");
  };

  return (
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">left × right</span>
        <span class="fd-value">
          {a()} × {b()}
        </span>
        <span class="fd-value is-strong">= {sum()}</span>
      </div>
      <div class="fd-actions">
        <button type="button" class="fd-btn" onClick={() => bump(left, "left")}>
          left + 1
        </button>
        <button type="button" class="fd-btn is-primary" onClick={() => bump(right, "right")}>
          right + 1
        </button>
      </div>
    </div>
  );
}
