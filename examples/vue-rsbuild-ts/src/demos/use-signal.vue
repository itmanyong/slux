<template>
  <div class="fd">
    <div class="fd-row">
      <span class="fd-label">count</span>
      <span class="fd-value is-strong">{{ value }}</span>
    </div>
    <div class="fd-actions">
      <button type="button" class="fd-btn" @click="dec">− 1</button>
      <button type="button" class="fd-btn is-primary" @click="inc">+ 1</button>
      <button type="button" class="fd-btn" @click="zero">归零</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { signal } from "@slux/core";
import { useSignal } from "@slux/vue";
import type { LogTone } from "@slux/shell-example";

type Log = (message: string, tone?: LogTone) => void;
const props = defineProps<{ log: Log }>();

const count = signal(0);
const value = useSignal(count);

const write = (next: number, message: string) => {
  count.set(next);
  props.log(`${message} → ${count.get()}`, "write");
};
const dec = () => write(count.get() - 1, "set");
const inc = () => write(count.get() + 1, "set");
const zero = () => write(0, "set");
</script>
