<template>
  <div class="fd">
    <div class="fd-row">
      <span class="fd-label">user</span>
      <span class="fd-value is-strong">{{ snap.user.name }}</span>
      <span class="fd-badge">{{ snap.user.scores.join(" / ") }}</span>
    </div>
    <div class="fd-actions">
      <button type="button" class="fd-btn is-primary" @click="addScore">追加成绩</button>
      <button type="button" class="fd-btn" @click="rename">改名</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { observable } from "@slux/proxy";
import { useSnapshot } from "@slux/vue/proxy";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;
const props = defineProps<{ log: Log }>();

const state = observable({ user: { name: "Ada", scores: [60, 72] } });
const snap = useSnapshot(state);

const addScore = () => {
  const scores = state.user.scores;
  scores.push(Math.min(100, (scores.at(-1) ?? 0) + 8));
  props.log(`scores.push → ${scores.at(-1)}`, "write");
};
const rename = () => {
  state.user.name = state.user.name === "Ada" ? "Lin" : "Ada";
  props.log(`name → ${state.user.name}`, "write");
};
</script>
