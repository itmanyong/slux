import { computed as nativeComputed } from "vitarx";
import { fromObservable } from "@slux/rxjs";
import { useObservable } from "@slux/vitarx/rxjs";
import { Subject } from "rxjs";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** useObservable：把 RxJS Observable 接进组件，next 即重渲染。 */
export function UseRxjsDemo({ log }: { log: Log }) {
  const events = new Subject<number>();
  let seq = 0;
  const source = fromObservable(events, 0);
  const value = useObservable(source);

  return (
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">latest</span>
        <span class="fd-value is-strong">{nativeComputed(() => String(value.value))}</span>
      </div>
      <div class="fd-actions">
        <button
          type="button"
          class="fd-btn is-primary"
          onClick={() => {
            seq += 1;
            events.next(seq);
            log(`events.next(${seq})`, "write");
          }}
        >
          推送事件
        </button>
      </div>
      <p class="fd-note">fromObservable 把 RxJS 流桥接为 Subscribable，useObservable 负责订阅与作用域清理。</p>
    </div>
  );
}
