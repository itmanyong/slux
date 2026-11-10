import { signal } from "@slux/core";
import { useSignal } from "@slux/solid";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

export function UseSignalDemo({ log }: { log: Log }) {
  const count = signal(0);
  const value = useSignal(count);

  const write = (next: number, message: string) => {
    count.set(next);
    log(`${message} → ${count.get()}`, "write");
  };

  return (
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">count</span>
        <span class="fd-value is-strong">{value()}</span>
      </div>
      <div class="fd-actions">
        <button type="button" class="fd-btn" onClick={() => write(value() - 1, "set")}>
          − 1
        </button>
        <button type="button" class="fd-btn is-primary" onClick={() => write(value() + 1, "set")}>
          + 1
        </button>
        <button type="button" class="fd-btn" onClick={() => write(0, "set")}>
          归零
        </button>
      </div>
    </div>
  );
}
