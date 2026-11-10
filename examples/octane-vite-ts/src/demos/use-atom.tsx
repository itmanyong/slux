import { useAtomValue, useSetAtom } from "@slux/octane/atom";
import type { AnyReadableAtom, Atom } from "@slux/atom";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface AtomProps {
  price: Atom<number>;
  double: AnyReadableAtom<number>;
  log: Log;
}

/** useAtomValue + useSetAtom：读写分离，派生 atom 自动跟随。 */
export function UseAtomDemo({ price, double, log }: AtomProps) {
  const value = useAtomValue(price);
  const twice = useAtomValue(double);
  const setPrice = useSetAtom(price);

  return (
    <div className="fd">
      <div className="fd-row">
        <span className="fd-label">price</span>
        <span className="fd-value is-strong">{value}</span>
        <span className="fd-label">derived ×2</span>
        <span className="fd-badge">{twice}</span>
      </div>
      <div className="fd-actions">
        <button
          type="button"
          className="fd-btn is-primary"
          onClick={() => {
            setPrice(value + 5);
            log(`price → ${value + 5}`, "write");
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
