import { computed as nativeComputed } from "vitarx";
import { computed, signal } from "@slux/core";
import { useSignal } from "@slux/vitarx";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** useSignal 订阅派生值：computed 只在依赖变化时惰性重算。 */
export function UseComputedDemo({ log }: { log: Log }) {
  const a = signal(3);
  const b = signal(4);
  const sum = computed(() => a.get() + b.get());
  const readA = useSignal(a);
  const readB = useSignal(b);
  const total = useSignal(sum);

  return (
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">a + b</span>
        <span class="fd-value is-strong">{nativeComputed(() => String(total.value))}</span>
        <span class="fd-label">a</span>
        <span class="fd-badge">{nativeComputed(() => String(readA.value))}</span>
        <span class="fd-label">b</span>
        <span class="fd-badge">{nativeComputed(() => String(readB.value))}</span>
      </div>
      <div class="fd-actions">
        <button
          type="button"
          class="fd-btn is-primary"
          onClick={() => {
            a.set(a.get() + 1);
            log(`a → ${a.get()}，sum 重算为 ${sum.get()}`, "compute");
          }}
        >
          a + 1
        </button>
        <button
          type="button"
          class="fd-btn"
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
