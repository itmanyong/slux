<script>
import { createStore } from "@slux/store";
import { toStore } from "@slux/svelte/store";

let { log } = $props();

const store = createStore(() => ({ items: 0, total: 0 }));
const items = toStore(store, (state) => state.items);

$effect(() => {
  log(`组件重渲染：items = ${$items}`, "notify");
});

const addItem = () => {
  store.setState((state) => ({ items: state.items + 1 }));
  log("setState → items + 1", "write");
};
const addTotal = () => {
  store.setState((state) => ({ total: state.total + 9.9 }));
  log("setState → total + 9.9（组件应不重渲染）", "write");
};
const clear = () => {
  store.setState({ items: 0, total: 0 });
  log("setState → 清空", "write");
};
</script>

<div class="fd">
  <div class="fd-row">
    <span class="fd-label">items（已订阅）</span>
    <span class="fd-value is-strong">{$items}</span>
    <span class="fd-label">total（未订阅）</span>
    <span class="fd-badge">{store.getState().total.toFixed(1)}</span>
  </div>
  <div class="fd-actions">
    <button type="button" class="fd-btn is-primary" onclick={addItem}>items + 1</button>
    <button type="button" class="fd-btn" onclick={addTotal}>只改 total</button>
    <button type="button" class="fd-btn" onclick={clear}>清空</button>
  </div>
  <p class="fd-note">badge 里的 total 是读取时的快照，点「运行日志」查看重渲染证据。</p>
</div>
