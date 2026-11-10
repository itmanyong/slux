<script>
import { observable } from "@slux/proxy";
import { toSnapshot } from "@slux/svelte/proxy";

let { log } = $props();

const state = observable({ user: { name: "Ada", scores: [60, 72] } });
const snap = toSnapshot(state);

const addScore = () => {
  const scores = state.user.scores;
  scores.push(Math.min(100, (scores.at(-1) ?? 0) + 8));
  log(`scores.push → ${scores.at(-1)}`, "write");
};
const rename = () => {
  state.user.name = state.user.name === "Ada" ? "Lin" : "Ada";
  log(`name → ${state.user.name}`, "write");
};
</script>

<div class="fd">
  <div class="fd-row">
    <span class="fd-label">user</span>
    <span class="fd-value is-strong">{$snap.user.name}</span>
    <span class="fd-badge">{$snap.user.scores.join(" / ")}</span>
  </div>
  <div class="fd-actions">
    <button type="button" class="fd-btn is-primary" onclick={addScore}>追加成绩</button>
    <button type="button" class="fd-btn" onclick={rename}>改名</button>
  </div>
</div>
