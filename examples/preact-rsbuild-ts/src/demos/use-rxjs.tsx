import { fromObservable } from "@slux/rxjs";
import { useObservable } from "@slux/preact/rxjs";
import { useState } from "preact/hooks";
import { Subject } from "rxjs";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** useObservable：把 RxJS Observable 接进组件，next 即重渲染。 */
export function UseRxjsDemo({ log }: { log: Log }) {
  const [state] = useState(() => {
    const events = new Subject<number>();
    let seq = 0;
    const source = fromObservable(events, 0);
    return { events, next: () => ++seq, source };
  });
  const value = useObservable(state.source);

  return (
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">latest</span>
        <span class="fd-value is-strong">{value}</span>
      </div>
      <div class="fd-actions">
        <button
          type="button"
          class="fd-btn is-primary"
          onClick={() => {
            state.events.next(state.next());
            log("events.next()", "write");
          }}
        >
          推送事件
        </button>
      </div>
      <p class="fd-note">fromObservable 把 RxJS 流桥接为 Subscribable，useObservable 负责订阅与卸载清理。</p>
    </div>
  );
}
