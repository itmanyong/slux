<script>
import { fromObservable } from "@slux/rxjs";
import { toObservableStore } from "@slux/svelte/rxjs";
import { Subject } from "rxjs";

let { log } = $props();

const events = new Subject();
let seq = 0;
const source = fromObservable(events, 0);
const value = toObservableStore(source);

const push = () => {
  seq += 1;
  events.next(seq);
  log("events.next()", "write");
};
</script>

<div class="fd">
  <div class="fd-row">
    <span class="fd-label">latest</span>
    <span class="fd-value is-strong">{$value}</span>
  </div>
  <div class="fd-actions">
    <button type="button" class="fd-btn is-primary" onclick={push}>推送事件</button>
  </div>
  <p class="fd-note">
    fromObservable 把 RxJS 流桥接为 Subscribable，toObservableStore
    负责订阅与卸载清理。
  </p>
</div>
