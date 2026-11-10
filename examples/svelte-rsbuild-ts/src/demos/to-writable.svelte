<script>
import { computed, signal } from "@slux/core";
import { toReadable, toWritable } from "@slux/svelte";

let { log } = $props();

const source = signal(0);
const count = toWritable(source);
const double = toReadable(computed(() => source.get() * 2));

const add = (by) => {
  count.update((n) => n + by);
  log(`count → ${source.get()}`, "write");
};
const reset = () => {
  count.set(0);
  log("count → 0", "write");
};
</script>

<div class="fd">
  <div class="fd-row">
    <span class="fd-label">count</span>
    <span class="fd-value is-strong">{$count}</span>
    <span class="fd-label">derived ×2</span>
    <span class="fd-badge">{$double}</span>
  </div>
  <div class="fd-actions">
    <button type="button" class="fd-btn is-primary" onclick={() => add(5)}>+ 5</button>
    <button type="button" class="fd-btn" onclick={reset}>重置</button>
  </div>
</div>
