import { atom, derived } from "@slux/atom";
import { useAtomValue, useSetAtom } from "@slux/actview/atom";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** useAtomValue + useSetAtom：读写分离，派生 atom 自动跟随。 */
export function UseAtomDemo({ log }: { log: Log }) {
  const price = atom(10);
  const double = derived((get) => get(price) * 2);
  const value = useAtomValue(price);
  const twice = useAtomValue(double);
  const setPrice = useSetAtom(price);

  return (
    <div className="fd">
      <div className="fd-row">
        <span className="fd-label">price</span>
        <span className="fd-value is-strong">{String(value.value)}</span>
        <span className="fd-label">derived ×2</span>
        <span className="fd-badge">{String(twice.value)}</span>
      </div>
      <div className="fd-actions">
        <button
          type="button"
          className="fd-btn is-primary"
          onClick={() => {
            setPrice(value.value + 5);
            log(`price → ${value.value + 5}`, "write");
          }}
        >
          + 5
        </button>
        <button
          type="button"
          className="fd-btn"
          onClick={() => {
            setPrice(10);
            log("price → 10", "write");
          }}
        >
          重置
        </button>
      </div>
    </div>
  );
}
