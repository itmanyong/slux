import { observable } from "@slux/proxy";
import { useSnapshot } from "@slux/preact/proxy";
import { useState } from "preact/hooks";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** useSnapshot：深层代理对象直接改属性，组件拿到不可变快照。 */
export function UseProxyDemo({ log }: { log: Log }) {
  const [state] = useState(() => observable({ user: { name: "Ada", scores: [60, 72] } }));
  const snap = useSnapshot(state);

  return (
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">user</span>
        <span class="fd-value is-strong">{snap.user.name}</span>
        <span class="fd-badge">{snap.user.scores.join(" / ")}</span>
      </div>
      <div class="fd-actions">
        <button
          type="button"
          class="fd-btn is-primary"
          onClick={() => {
            state.user.scores.push(Math.min(100, state.user.scores.at(-1)! + 8));
            log(`scores.push → ${state.user.scores.at(-1)}`, "write");
          }}
        >
          追加成绩
        </button>
        <button
          type="button"
          class="fd-btn"
          onClick={() => {
            state.user.name = state.user.name === "Ada" ? "Lin" : "Ada";
            log(`name → ${state.user.name}`, "write");
          }}
        >
          改名
        </button>
      </div>
    </div>
  );
}
