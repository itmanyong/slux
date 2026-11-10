import { atom, derived } from "@slux/atom";
import { useAtomValue, useSetAtom } from "@slux/preact/atom";
import { useState } from "preact/hooks";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

/** useAtomValue + useSetAtom：读写分离，派生 atom 自动跟随。 */
export function UseAtomDemo({ log }: { log: Log }) {
  const [{ price, double }] = useState(() => {
    const price = atom(10);
    const double = derived((get) => get(price) * 2);
    return { price, double };
  });
  const value = useAtomValue(price);
  const twice = useAtomValue(double);
  const setPrice = useSetAtom(price);

  return (
    <div class="fd">
      <div class="fd-row">
        <span class="fd-label">price</span>
        <span class="fd-value is-strong">{value}</span>
        <span class="fd-label">derived ×2</span>
        <span class="fd-badge">{twice}</span>
      </div>
      <div class="fd-actions">
        <button
          type="button"
          class="fd-btn is-primary"
          onClick={() => {
            setPrice(value + 5);
            log(`price → ${value + 5}`, "write");
          }}
        >
          + 5
        </button>
        <button
          type="button"
          class="fd-btn"
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
