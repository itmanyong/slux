<template>
  <div class="fd">
    <div class="fd-row">
      <span class="fd-label">count</span>
      <span class="fd-value is-strong">{{ state.count }}</span>
    </div>
    <div class="fd-actions">
      <button type="button" class="fd-btn is-primary" @click="inc(1)">+ 1</button>
      <button type="button" class="fd-btn" @click="inc(5)">+ 5</button>
      <button type="button" class="fd-btn" @click="reset">重置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createFluxStore } from "@slux/flux";
import { useFluxStore } from "@slux/vue/flux";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;

interface CounterState {
  count: number;
}

type CounterAction = { type: "increment"; by: number } | { type: "reset" };

const props = defineProps<{ log: Log }>();

const store = createFluxStore<CounterState, CounterAction>(
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
const state = useFluxStore(store);

const inc = (by: number) => {
  store.dispatch({ type: "increment", by });
  props.log(`dispatch increment by ${by}`, "write");
};
const reset = () => {
  store.dispatch({ type: "reset" });
  props.log("dispatch reset", "write");
};
</script>
