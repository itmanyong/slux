import { createStore } from "@slux/store";
import { useStore } from "@slux/ripple/store";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface CartState {
  items: number;
  total: number;
}

/** useStore + selector：组件只订阅 items 切片，改 total 不触发重渲染。 */
export function UseStoreDemo(props: { log: Log }) @{
  const store = createStore<CartState>(() => ({ items: 0, total: 0 }));
  const items = useStore(store, (state) => state.items);

  <div class="fd">
    <div class="fd-row">
      <span class="fd-label">items（已订阅）</span>
      <span class="fd-value is-strong">{items.value}</span>
      <span class="fd-label">total（未订阅）</span>
      <span class="fd-badge">{store.getState().total.toFixed(1)}</span>
    </div>
    <div class="fd-actions">
      <button
        type="button"
        class="fd-btn is-primary"
        onClick={() => {
          store.setState((state) => ({ items: state.items + 1 }));
          props.log("setState → items + 1", "write");
        }}
      >
        items + 1
      </button>
      <button
        type="button"
        class="fd-btn"
        onClick={() => {
          store.setState((state) => ({ total: state.total + 9.9 }));
          props.log("setState → total + 9.9（组件应不重渲染）", "write");
        }}
      >
        只改 total
      </button>
      <button
        type="button"
        class="fd-btn"
        onClick={() => {
          store.setState({ items: 0, total: 0 });
          props.log("setState → 清空", "write");
        }}
      >
        清空
      </button>
    </div>
    <p class="fd-note">
      badge 里的 total 是读取时的快照；selector 只订阅 items，切片相等时 Derived
      不更新。
    </p>
  </div>
}
