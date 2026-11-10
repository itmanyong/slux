import { createStore } from "@slux/store";
import { useStore } from "@slux/react/store";
import { useEffect, useState } from "react";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface CartState {
  items: number;
  total: number;
}

/**
 * useStore + selector：组件只订阅 `items` 切片，
 * 只改 `total` 时不会触发这个组件重渲染。
 */
export function UseStoreDemo({ log }: { log: Log }) {
  const [store] = useState(() => createStore<CartState>(() => ({ items: 0, total: 0 })));
  const items = useStore(store, (state) => state.items);

  useEffect(() => {
    log(`组件重渲染：items = ${items}`, "notify");
  });

  return (
    <div className="fd">
      <div className="fd-row">
        <span className="fd-label">items（已订阅）</span>
        <span className="fd-value is-strong">{items}</span>
        <span className="fd-label">total（未订阅）</span>
        <span className="fd-badge">{store.getState().total.toFixed(1)}</span>
      </div>
      <div className="fd-actions">
        <button
          type="button"
          className="fd-btn is-primary"
          onClick={() => {
            store.setState((state) => ({ items: state.items + 1 }));
            log("setState → items + 1", "write");
          }}
        >
          items + 1
        </button>
        <button
          type="button"
          className="fd-btn"
          onClick={() => {
            store.setState((state) => ({ total: state.total + 9.9 }));
            log("setState → total + 9.9（组件应不重渲染）", "write");
          }}
        >
          只改 total
        </button>
        <button
          type="button"
          className="fd-btn"
          onClick={() => {
            store.setState({ items: 0, total: 0 });
            log("setState → 清空", "write");
          }}
        >
          清空
        </button>
      </div>
      <p className="fd-note">badge 里的 total 是读取时的快照，点「渲染日志」查看重渲染证据。</p>
    </div>
  );
}
