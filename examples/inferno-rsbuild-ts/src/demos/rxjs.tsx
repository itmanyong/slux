import { fromObservable } from "@slux/rxjs";
import { ObservableValue } from "@slux/inferno/rxjs";
import { Component } from "inferno";
import type { InfernoNode } from "inferno";
import { Subject } from "rxjs";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface DemoProps {
  log: Log;
}

/** ObservableValue：RxJS 流经 fromObservable 桥接，next 即重渲染。 */
export class RxjsDemo extends Component<DemoProps> {
  #events = new Subject<number>();
  #seq = 0;
  #source = fromObservable(this.#events, 0);

  override render(): InfernoNode {
    return (
      <div class="fd">
        <div class="fd-row">
          <span class="fd-label">latest</span>
          <ObservableValue<number> source={this.#source}>{(value) => <span class="fd-value is-strong">{String(value)}</span>}</ObservableValue>
        </div>
        <div class="fd-actions">
          <button
            type="button"
            class="fd-btn is-primary"
            onClick={() => {
              this.#seq += 1;
              this.#events.next(this.#seq);
              this.props.log(`events.next(${this.#seq})`, "write");
            }}
          >
            推送事件
          </button>
        </div>
        <p class="fd-note">fromObservable 把 RxJS 流桥接为 Subscribable，ObservableValue 负责订阅与卸载清理。</p>
      </div>
    );
  }
}
