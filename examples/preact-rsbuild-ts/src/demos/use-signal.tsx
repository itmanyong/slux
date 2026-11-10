import { signal } from "@slux/core";
import { useSignal } from "@slux/preact";
import { useState } from "preact/hooks";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** useSignal：组件订阅任意 Subscribable，值变化即重渲染。 */
export function UseSignalDemo({ log }: { log: Log }) {
  const [count] = useState(() => signal(0));
  const value = useSignal(count);

  return (
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">count</span>
        <span class="fd-value is-strong">{value}</span>
      </div>
      <div class="fd-actions">
        <button
          type="button"
          class="fd-btn"
          onClick={() => {
            count.set(count.get() - 1);
            log(`set → ${count.get()}`, "write");
          }}
        >
          − 1
        </button>
        <button
          type="button"
          class="fd-btn is-primary"
          onClick={() => {
            count.set(count.get() + 1);
            log(`set → ${count.get()}`, "write");
          }}
        >
          + 1
        </button>
        <button
          type="button"
          class="fd-btn"
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
