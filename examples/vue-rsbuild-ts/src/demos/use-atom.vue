<template>
  <div class="fd">
    <div class="fd-row">
      <span class="fd-label">price</span>
      <span class="fd-value is-strong">{{ value }}</span>
      <span class="fd-label">derived ×2</span>
      <span class="fd-badge">{{ twice }}</span>
    </div>
    <div class="fd-actions">
      <button type="button" class="fd-btn is-primary" @click="raise">+ 5</button>
      <button type="button" class="fd-btn" @click="reset">重置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { atom, derived } from "@slux/atom";
import { useAtomValue, useSetAtom } from "@slux/vue/atom";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;
const props = defineProps<{ log: Log }>();

const price = atom(10);
const double = derived((get) => get(price) * 2);

const value = useAtomValue(price);
const twice = useAtomValue(double);
const setPrice = useSetAtom(price);

const raise = () => {
  const next = value.value + 5;
  setPrice(next);
  props.log(`price → ${next}`, "write");
};
const reset = () => {
  setPrice(10);
  props.log("price → 10", "write");
};
</script>
