import { useSnapshot } from "@slux/octane/proxy";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface User {
  user: { name: string; scores: number[] };
}

/** useSnapshot：深层代理对象直接改属性，组件拿到不可变快照。 */
export function UseProxyDemo({ user, log }: { user: User; log: Log }) {
  const snap = useSnapshot(user);

  return (
    <div className="fd">
      <div className="fd-row">
        <span className="fd-label">user</span>
        <span className="fd-value is-strong">{snap.user.name}</span>
        <span className="fd-badge">{snap.user.scores.join(" / ")}</span>
      </div>
      <div className="fd-actions">
        <button
          type="button"
          className="fd-btn is-primary"
          onClick={() => {
            user.user.scores.push(Math.min(100, user.user.scores.at(-1)! + 8));
            log(`scores.push → ${user.user.scores.at(-1)}`, "write");
          }}
        >
          追加成绩
        </button>
        <button
          type="button"
          className="fd-btn"
          onClick={() => {
            user.user.name = user.user.name === "Ada" ? "Lin" : "Ada";
            log(`name → ${user.user.name}`, "write");
          }}
        >
          改名
        </button>
      </div>
    </div>
  );
}
