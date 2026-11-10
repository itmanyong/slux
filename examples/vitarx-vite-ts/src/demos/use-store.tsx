import { computed as nativeComputed } from "vitarx";
import { createStore } from "@slux/store";
import { useStore } from "@slux/vitarx/store";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface CartState {
  items: number;
  total: number;
}

/**
 * useStore + selector：组件只订阅 `items` 切片，
 * 只改 `total` 时不会触发这个切片的 ShallowRef 写回。
 */
export function UseStoreDemo({ log }: { log: Log }) {
  const store = createStore<CartState>(() => ({ items: 0, total: 0 }));
  const items = useStore(store, (state) => state.items);

  return (
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">items（已订阅）</span>
        <span class="fd-value is-strong">{nativeComputed(() => String(items.value))}</span>
        <span class="fd-label">total（未订阅）</span>
        <span class="fd-badge">{store.getState().total.toFixed(1)}</span>
      </div>
      <div class="fd-actions">
        <button
          type="button"
          class="fd-btn is-primary"
          onClick={() => {
            store.setState((state) => ({ items: state.items + 1 }));
            log("setState → items + 1", "write");
          }}
        >
          items + 1
        </button>
        <button
          type="button"
          class="fd-btn"
          onClick={() => {
            store.setState((state) => ({ total: state.total + 9.9 }));
            log("setState → total + 9.9（切片未变，不触发更新）", "write");
          }}
        >
          只改 total
        </button>
        <button
          type="button"
          class="fd-btn"
          onClick={() => {
            store.setState({ items: 0, total: 0 });
            log("setState → 清空", "write");
          }}
        >
          清空
        </button>
      </div>
      <p class="fd-note">badge 里的 total 是本次渲染时读取的快照；selector 结果不变就不会写回 ShallowRef。</p>
    </div>
  );
}
