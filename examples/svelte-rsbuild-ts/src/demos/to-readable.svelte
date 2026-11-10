<script>
import { signal } from "@slux/core";
import { toReadable } from "@slux/svelte";

let { log } = $props();

const count = signal(0);
const value = toReadable(count);

const write = (next, message) => {
  count.set(next);
  log(`${message} → ${count.get()}`, "write");
};
</script>

<div class="fd">
  <div class="fd-row">
    <span class="fd-label">count</span>
    <span class="fd-value is-strong">{$value}</span>
  </div>
  <div class="fd-actions">
    <button type="button" class="fd-btn" onclick={() => write($value - 1, "set")}>− 1</button>
    <button type="button" class="fd-btn is-primary" onclick={() => write($value + 1, "set")}>+ 1</button>
    <button type="button" class="fd-btn" onclick={() => write(0, "set")}>归零</button>
  </div>
</div>
