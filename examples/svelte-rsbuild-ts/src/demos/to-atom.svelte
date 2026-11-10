<script>
import { atom, derived } from "@slux/atom";
import { toAtom, toAtomValue } from "@slux/svelte/atom";

let { log } = $props();

const price = atom(10);
const double = derived((get) => get(price) * 2);

const value = toAtom(price);
const twice = toAtomValue(double);

const raise = () => {
  const next = $value + 5;
  value.set(next);
  log(`price → ${next}`, "write");
};
const reset = () => {
  value.set(10);
  log("price → 10", "write");
};
</script>

<div class="fd">
  <div class="fd-row">
    <span class="fd-label">price</span>
    <span class="fd-value is-strong">{$value}</span>
    <span class="fd-label">derived ×2</span>
    <span class="fd-badge">{$twice}</span>
  </div>
  <div class="fd-actions">
    <button type="button" class="fd-btn is-primary" onclick={raise}>+ 5</button>
    <button type="button" class="fd-btn" onclick={reset}>重置</button>
  </div>
</div>
