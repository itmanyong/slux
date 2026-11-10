import { useObservable } from "@slux/octane/rxjs";
import type { ObservableState } from "@slux/rxjs";
import type { Subject } from "rxjs";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** useObservable：把 RxJS Observable 接进组件，next 即重渲染。 */
export function UseRxjsDemo({ events, source, log }: { events: Subject<number>; source: ObservableState<number>; log: Log }) {
  const value = useObservable(source);

  return (
    <div className="fd">
      <div className="fd-row">
        <span className="fd-label">latest</span>
        <span className="fd-value is-strong">{value}</span>
      </div>
      <div className="fd-actions">
        <button
          type="button"
          className="fd-btn is-primary"
          onClick={() => {
            events.next(value + 1);
            log(`events.next(${value + 1})`, "write");
          }}
        >
          推送事件
        </button>
      </div>
      <p className="fd-note">fromObservable 把 RxJS 流桥接为 Subscribable，useObservable 负责订阅与卸载清理。</p>
    </div>
  );
}
