import { observable } from "@slux/proxy";
import { useSnapshot } from "@slux/actview/proxy";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** useSnapshot：深层代理对象直接改属性，组件拿到不可变快照。 */
export function UseProxyDemo({ log }: { log: Log }) {
  const state = observable({ user: { name: "Ada", scores: [60, 72] } });
  const snap = useSnapshot(state);

  return (
    <div className="fd">
      <div className="fd-row">
        <span className="fd-label">user</span>
        <span className="fd-value is-strong">{String(snap.value.user.name)}</span>
        <span className="fd-badge">{snap.value.user.scores.join(" / ")}</span>
      </div>
      <div className="fd-actions">
        <button
          type="button"
          className="fd-btn is-primary"
          onClick={() => {
            state.user.scores.push(Math.min(100, state.user.scores.at(-1)! + 8));
            log(`scores.push → ${state.user.scores.at(-1)}`, "write");
          }}
        >
          追加成绩
        </button>
        <button
          type="button"
          className="fd-btn"
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
