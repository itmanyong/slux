<script>
import { createFluxStore } from "@slux/flux";
import { toFluxStore } from "@slux/svelte/flux";

let { log } = $props();

const store = createFluxStore(
  (state, action) => {
    switch (action.type) {
      case "increment":
        return { count: state.count + action.by };
      case "reset":
        return { count: 0 };
    }
  },
  { count: 0 },
);
const state = toFluxStore(store);

const inc = (by) => {
  store.dispatch({ type: "increment", by });
  log(`dispatch increment by ${by}`, "write");
};
const reset = () => {
  store.dispatch({ type: "reset" });
  log("dispatch reset", "write");
};
</script>

<div class="fd">
  <div class="fd-row">
    <span class="fd-label">count</span>
    <span class="fd-value is-strong">{$state.count}</span>
  </div>
  <div class="fd-actions">
    <button type="button" class="fd-btn is-primary" onclick={() => inc(1)}>+ 1</button>
    <button type="button" class="fd-btn" onclick={() => inc(5)}>+ 5</button>
    <button type="button" class="fd-btn" onclick={reset}>重置</button>
  </div>
</div>
