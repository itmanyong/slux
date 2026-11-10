import { fromObservable } from "@slux/rxjs";
import { useObservable } from "@slux/solid/rxjs";
import { Subject } from "rxjs";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

export function UseRxjsDemo({ log }: { log: Log }) {
  const events = new Subject<number>();
  let seq = 0;
  const source = fromObservable(events, 0);
  const value = useObservable(source);

  return (
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">latest</span>
        <span class="fd-value is-strong">{value()}</span>
      </div>
      <div class="fd-actions">
        <button
          type="button"
          class="fd-btn is-primary"
          onClick={() => {
            seq += 1;
            events.next(seq);
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
